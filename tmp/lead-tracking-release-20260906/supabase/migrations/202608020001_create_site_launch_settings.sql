create table if not exists public.site_launch_settings (
  key text primary key,
  value boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.site_launch_settings enable row level security;
revoke all on table public.site_launch_settings from anon, authenticated;
grant select, insert, update on table public.site_launch_settings to service_role;

insert into public.site_launch_settings (key, value)
values ('hayward_location_revealed', false)
on conflict (key) do nothing;
