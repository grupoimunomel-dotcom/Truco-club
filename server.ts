import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { createGame, startHand, playCard, raiseTruco, answerRaise, callSpecial, answerSpecial, resolveTrick, type GameState, type GameMode } from './game';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.');
export const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export type RoomPlayer = { id:string; seat:number; display_name:string; player_token_hash:string; connected:boolean };
export async function roomByCode(code:string) {
  const {data:room,error}=await db.from('truco_rooms').select('*').eq('code',code.toUpperCase()).maybeSingle();
  if(error) throw error; if(!room) return null;
  const [{data:players,error:pe},{data:state,error:se}]=await Promise.all([
    db.from('truco_room_players').select('id,seat,display_name,player_token_hash,connected').eq('room_id',room.id).order('seat'),
    db.from('truco_room_state').select('state,version').eq('room_id',room.id).maybeSingle()
  ]);
  if(pe) throw pe; if(se) throw se;
  return {room,players:(players||[]) as RoomPlayer[],state:state?.state as GameState|undefined,version:Number(state?.version||0)};
}
export function publicState(g:GameState, seat:number) {
  return {...g,players:g.players.map(p=>({...p,hand:p.seat===seat||g.specialCardsOpen?p.hand:p.hand.map(()=>({id:'hidden',rank:'?',suit:'♠',power:0,label:'??'}))})),deck:[]};
}
export async function saveState(roomId:string, state:GameState, version:number) {
  const {data,error}=await db.from('truco_room_state').update({state,version:version+1,updated_at:new Date().toISOString()}).eq('room_id',roomId).eq('version',version).select('version').maybeSingle();
  if(error) throw error; if(!data) throw new Error('A mesa foi atualizada por outro jogador. Atualize e tente novamente.');
  await db.from('truco_room_events').insert({room_id:roomId,version:version+1,event_type:'state',public_payload:{phase:state.phase,message:state.message}});
}
export async function authenticatedRoom(code:string, token:string) {
  const found=await roomByCode(code); if(!found) return null;
  const player=found.players.find(p=>p.player_token_hash===hashToken(token));
  if(!player) throw new Error('Token inválido para esta sala.');
  return {...found,player};
}
export function newGame(mode:GameMode, players:RoomPlayer[]):GameState {
  const count=mode==='individual'?2:4;
  const names=Array.from({length:count},(_,i)=>players.find(p=>p.seat===i)?.display_name||`Jogador ${i+1}`);
  return createGame(names,mode);
}
export function applyAction(g:GameState, seat:number, action:Record<string,unknown>):GameState {
  if(action.type==='start') { if(g.phase!=='waiting') throw new Error('A partida já começou.'); return startHand(g); }
  if(action.type==='play') {
    const next=playCard(g,seat,String(action.cardId||''));
    if(next===g) throw new Error('Não é possível jogar essa carta agora.');
    return next.plays.length===next.players.length?resolveTrick(next):next;
  }
  if(action.type==='raise') { const n=raiseTruco(g,seat); if(n===g) throw new Error('Não é possível pedir aumento agora.'); return n; }
  if(action.type==='answer-raise') { return answerRaise(g,seat,action.answer as 'accept'|'run'|'raise'); }
  if(action.type==='special') { const n=callSpecial(g,action.hand as 'mao-real'|'mao-baixa',seat); if(n===g) throw new Error('Não é possível pedir essa mão agora.'); return n; }
  if(action.type==='answer-special') { return answerSpecial(g,action.answer as 'doubt'|'leave',seat); }
  if(action.type==='next-hand') { if(g.phase!=='hand-end') throw new Error('A mão ainda não terminou.'); return startHand(g); }
  if(action.type==='timeout') { if(!g.deadline || Date.now()<g.deadline) throw new Error('O tempo da jogada ainda não acabou.'); if(g.specialDecision==='pending') return answerSpecial(g,'leave'); if(g.message.includes('Aceitar, correr ou aumentar?')) return answerRaise(g,seat,'run'); const active=g.players[g.currentSeat]; const card=active?.hand[0]; if(!card) throw new Error('Não há carta para jogar automaticamente.'); const next=playCard(g,g.currentSeat,card.id); return next.plays.length===next.players.length?resolveTrick(next):next; }
  throw new Error('Ação desconhecida.');
}
