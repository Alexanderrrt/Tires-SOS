create table if not exists public.analytics_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  period_label text not null check (char_length(period_label) between 1 and 120),
  period_start date not null,
  period_end date not null,
  summary jsonb not null default '{}'::jsonb,
  html text not null check (char_length(html) between 1 and 500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_reports_period_order check (period_end >= period_start),
  constraint analytics_reports_period_unique unique (period_start, period_end)
);

create index if not exists analytics_reports_period_end_idx
  on public.analytics_reports (period_end desc);

alter table public.analytics_reports
  alter column id set default gen_random_uuid();

alter table public.analytics_reports enable row level security;
revoke all on table public.analytics_reports from anon, authenticated;
grant select, insert, update, delete on table public.analytics_reports to service_role;

comment on table public.analytics_reports is
  'Server-managed weekly PostHog reports rendered in the authenticated dashboard.';
