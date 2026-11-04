# Truco Club — Truco Paulista

Aplicação Next.js para Truco Paulista com modos **Individual (1v1)** e **Duplas (2v2)**.

## Regras e decisões do produto

- Baralho de 40 cartas; manilha pela vira.
- Partida até 12 tentos; mão normal vale 1, Truco 3, Seis 6, Nove 9 e Doze 12.
- Mão Real: três figuras (J, Q ou K), conforme regra combinada nesta versão.
- Mão Baixa: três cartas entre 4 e 7, inclusive.
- Pedido especial permite duvidar ou deixar; a troca é apenas das cartas de quem pediu, nunca dos demais.
- Timer de decisão: 15 segundos.

## Rodar localmente

1. Instale Node.js 20 ou superior.
2. `npm install`
3. Copie `.env.example` para `.env.local` e preencha as variáveis.
4. `npm run dev`

## Variáveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL`: URL raiz do projeto, sem `/rest/v1/`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave `sb_publishable_...` (ou anon legada).

Nunca coloque `service_role`/`secret key` em variáveis `NEXT_PUBLIC_*` nem no GitHub.

## Estado honesto do projeto

A tela atual e `lib/game.ts` formam um **protótipo local** para validar visual e regras. Ainda NÃO existe multiplayer online funcional: não há fluxo de criar/entrar em sala, autenticação de assento, sincronização autoritativa, reconexão ou validação de jogadas no servidor. Não publique como jogo pronto.

Foi incluída uma migração inicial em `supabase/migrations/`. Ela cria as tabelas privadas de salas/estado/eventos com RLS fechado. O estado com cartas deve permanecer no servidor. Para liberar multiplayer, é necessário implementar e testar Edge Functions autenticando um token individual por assento, processando cada ação no servidor e enviando aos clientes somente uma visão sanitizada da partida. Não habilite leitura pública de `truco_room_state`.

## Publicação

Depois de implementar e testar o backend multiplayer:

1. Envie este projeto ao repositório GitHub `grupoimunomel-dotcom/Truco-club`.
2. Importe o repositório na Vercel.
3. Cadastre `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas Environment Variables da Vercel.
4. Execute a migração SQL no SQL Editor do Supabase.
5. Configure secrets das Edge Functions somente no painel/CLI do Supabase; nunca no navegador.
