# Truco Club — base multiplayer

Aplicação Next.js com salas privadas e estado de jogo armazenado no Supabase. Os clientes nunca recebem a chave `service_role`; as rotas `/api` executam no servidor e autenticam cada assento por token aleatório, armazenando somente o hash no banco.

## O que esta entrega implementa
- Criar sala privada com código de 6 caracteres.
- Entrar em sala 1x1 ou 2x2 até completar os assentos.
- Estado compartilhado consultado periodicamente pelas telas dos jogadores.
- Cartas privadas por jogador; cartas jogadas e placar são públicos.
- Rotas de servidor para iniciar mão, jogar carta, aumentar aposta, responder aposta e pedir/responder Mão Real ou Mão Baixa.
- Atualização otimista por versão para detectar duas jogadas simultâneas.

## Antes de publicar
Esta é uma primeira implementação multiplayer para homologação, não uma versão certificada para partidas valendo. O mecanismo de regras herdado precisa de testes adicionais: resolução de empates do Truco Paulista, validação completa de quem pode responder a cada pedido, cronômetro autoritativo com jogada automática, reconexão/expiração de assentos e testes de concorrência. Não anuncie como versão final antes desses testes.

## Configuração
1. No Supabase, execute uma única vez a migração `supabase/migrations/202611030001_initial_schema.sql` no SQL Editor. Se as quatro tabelas já existem, não execute novamente.
2. Na Vercel, configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL raiz do projeto, sem `/rest/v1`.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave secreta do projeto, somente no ambiente server-side da Vercel. Nunca compartilhar no chat, nunca usar prefixo `NEXT_PUBLIC_`, nunca enviar ao GitHub.
3. Faça redeploy depois de configurar as variáveis.
4. Teste em duas janelas/celulares: criar sala, entrar pelo código, aguardar o número correto de jogadores e iniciar.

## Segurança
A chave `SUPABASE_SERVICE_ROLE_KEY` dá acesso administrativo ao banco. Ela deve existir apenas nas Environment Variables da Vercel. Se aparecer em um arquivo versionado, remova-a e faça rotação no painel Supabase.

## Desenvolvimento local
`npm install`, configure `.env.local` com as mesmas variáveis e rode `npm run dev`.
