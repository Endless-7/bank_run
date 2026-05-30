create table if not exists public.global_game (
  id int primary key check (id = 1),
  state jsonb not null,
  version int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.global_game enable row level security;

-- API uses service role key; no public client access needed.
revoke all on table public.global_game from anon, authenticated;

insert into public.global_game (id, state, version)
values (
  1,
  jsonb_build_object(
    'roundId', 1,
    'phase', 'playing',
    'totalClicks', 0,
    'exploded', false,
    'endReason', null,
    'results', null,
    'resultsEndsAt', null,
    'serverStartedAt', (extract(epoch from now()) * 1000)::bigint,
    'players', '{}'::jsonb,
    'visitors', '[]'::jsonb
  ),
  0
)
on conflict (id) do nothing;
