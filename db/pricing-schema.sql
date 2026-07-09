-- Tires SOS Rescue - admin settings store.
-- Run once in the Supabase SQL editor. Stores the whole pricing document plus
-- chat admin settings as a single JSONB row (id = 1). The site reads/writes it
-- with the service-role key from the server only, so Row Level Security can
-- stay on with no public policy.

create table if not exists public.pricing (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint pricing_singleton check (id = 1)
);

alter table public.pricing enable row level security;

-- Seed the singleton row if it does not exist yet. The app also self-heals by
-- falling back to its bundled defaults, but seeding here means the admin panel
-- shows real values immediately.
insert into public.pricing (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
