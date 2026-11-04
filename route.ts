import { NextRequest,NextResponse } from 'next/server';
import { authenticatedRoom, publicState } from '../../../../lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{code:string}>}) {
 try { const {code}=await params; const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'')||''; const found=await authenticatedRoom(code,token); if(!found) return NextResponse.json({error:'Sala não encontrada.'},{status:404});
  return NextResponse.json({code:found.room.code,mode:found.room.mode,status:found.room.status,seat:found.player.seat,players:found.players.map(p=>({seat:p.seat,name:p.display_name,connected:p.connected})),game:found.state?publicState(found.state,found.player.seat):null,version:found.version});
 } catch(e:any) { return NextResponse.json({error:e.message||'Erro interno.'},{status:401}); }
}
