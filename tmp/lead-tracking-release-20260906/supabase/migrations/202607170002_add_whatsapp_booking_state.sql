alter table public.whatsapp_conversations
  add column if not exists offered_slots jsonb not null default '[]'::jsonb,
  add column if not exists lead_session_id text,
  add column if not exists appointment_id text;
