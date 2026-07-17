create table if not exists public.whatsapp_settings (
  id boolean primary key default true,
  bot_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint whatsapp_settings_singleton check (id)
);

insert into public.whatsapp_settings (id, bot_enabled)
values (true, false)
on conflict (id) do nothing;

alter table public.whatsapp_settings enable row level security;
revoke all on public.whatsapp_settings from anon, authenticated;
grant select, insert, update on public.whatsapp_settings to service_role;

update public.chat_leads
set source = 'WhatsApp', updated_at = now()
where session_id like 'whatsapp\_%' escape '\';
