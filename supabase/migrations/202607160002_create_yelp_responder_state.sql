-- Tracks the time window boundary for the Yelp lead responder: each run only
-- considers messages received after the previous run started, so it never
-- reprocesses an old backlog regardless of Gmail's read/unread state.
create table if not exists public.yelp_responder_state (
  id text primary key default 'singleton',
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.yelp_responder_state (id)
values ('singleton')
on conflict (id) do nothing;

alter table public.yelp_responder_state enable row level security;
revoke all on table public.yelp_responder_state from anon, authenticated;
grant select, insert, update, delete on table public.yelp_responder_state to service_role;

comment on table public.yelp_responder_state is
  'Single-row watermark: yelp-lead-responder only processes Gmail messages received after last_checked_at.';
