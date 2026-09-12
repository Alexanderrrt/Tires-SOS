create table if not exists public.yelp_leads (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text not null unique,
  sender_email text,
  customer_name text,
  customer_message text not null check (char_length(customer_message) between 1 and 20000),
  ai_reply text,
  status text not null default 'pending' check (status in ('pending', 'replied', 'failed')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create index if not exists yelp_leads_created_at_idx
  on public.yelp_leads (created_at desc);

alter table public.yelp_leads enable row level security;
revoke all on table public.yelp_leads from anon, authenticated;
grant select, insert, update, delete on table public.yelp_leads to service_role;

comment on table public.yelp_leads is
  'Yelp "Request a Quote" lead emails detected and auto-replied to by the yelp-lead-responder cron job.';
