alter table public.whatsapp_conversations
  add column if not exists context_enabled boolean not null default true;
