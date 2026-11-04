-- Truco Club: estrutura inicial segura para salas multiplayer.

create extension if not exists pgcrypto;

create table if not exists public.truco_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  mode text not null check (mode in ('individual','duplas')),
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  target_score integer not null default 12 check (target_score = 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.truco_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.truco_rooms(id) on delete cascade,
  seat integer not null check (seat between 0 and 3),
  display_name text not null check (char_length(display_name) between 1 and 24),
  player_token_hash text not null,
  connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique(room_id, seat),
  unique(room_id, player_token_hash)
);

create table if not exists public.truco_room_state (
  room_id uuid primary key references public.truco_rooms(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.truco_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.truco_rooms(id) on delete cascade,
  version bigint not null,
  event_type text not null,
  public_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(room_id, version)
);

create index if not exists truco_rooms_code_idx on public.truco_rooms(code);
create index if not exists truco_room_players_room_idx on public.truco_room_players(room_id);
create index if not exists truco_room_events_room_idx on public.truco_room_events(room_id, version);

alter table public.truco_rooms enable row level security;
alter table public.truco_room_players enable row level security;
alter table public.truco_room_state enable row level security;
alter table public.truco_room_events enable row level security;

revoke all on public.truco_rooms from anon, authenticated;
revoke all on public.truco_room_players from anon, authenticated;
revoke all on public.truco_room_state from anon, authenticated;
revoke all on public.truco_room_events from anon, authenticated;
