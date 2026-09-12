create table if not exists public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,
  customer_name text,
  bot_enabled boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  meta_message_id text unique,
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  body text not null,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_conversation_created_idx
  on public.whatsapp_messages(conversation_id, created_at);
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;
revoke all on public.whatsapp_conversations, public.whatsapp_messages from anon, authenticated;
grant select, insert, update, delete on public.whatsapp_conversations, public.whatsapp_messages to service_role;
