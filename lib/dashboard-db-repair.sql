-- Idempotent repair for databases created from an earlier dashboard schema.
-- Run once in the Supabase SQL editor, then reload the PostgREST schema cache.

BEGIN;

ALTER TABLE IF EXISTS public.dashboard_clients
  ADD COLUMN IF NOT EXISTS ad_spend_budget DECIMAL(10,2) DEFAULT 500.00;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dashboard_clients'
      AND column_name = 'ad_budget'
  ) THEN
    EXECUTE 'UPDATE public.dashboard_clients SET ad_spend_budget = COALESCE(ad_budget, ad_spend_budget)';
  END IF;
END $$;

ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS management_fee DECIMAL(10,2);

CREATE TABLE IF NOT EXISTS public.ad_connections (
  id INTEGER PRIMARY KEY,
  connections JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.dashboard_clients (
  id, client_name, business_email, status, monthly_fee, ad_spend_budget, api_key
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Tires SOS Rescue',
  'tiressosrescue@gmail.com',
  'active',
  450.00,
  500.00,
  'internal-clerk-only'
)
ON CONFLICT (business_email) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  business_email = EXCLUDED.business_email,
  monthly_fee = EXCLUDED.monthly_fee,
  ad_spend_budget = EXCLUDED.ad_spend_budget,
  status = EXCLUDED.status;

CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_user ON public.dashboard_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_accounts_client ON public.platform_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_date ON public.daily_metrics(client_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign ON public.daily_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_variations_client ON public.ad_variations(client_id);
CREATE INDEX IF NOT EXISTS idx_variation_performance_variation ON public.variation_performance(variation_id);
CREATE INDEX IF NOT EXISTS idx_optimization_runs_client_date ON public.optimization_runs(client_id, run_date DESC);
DROP INDEX IF EXISTS public.idx_alerts_client_unresolved;
CREATE INDEX idx_alerts_client_unresolved ON public.alerts(client_id, created_at DESC) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_manual_actions_client ON public.manual_actions(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices(client_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_client ON public.client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_client_created ON public.api_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_client ON public.keywords(client_id);
CREATE INDEX IF NOT EXISTS idx_keyword_performance_keyword ON public.keyword_performance(keyword_id);

CREATE OR REPLACE VIEW public.client_summary
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.client_name,
  c.status,
  (SELECT COUNT(*) FROM public.platform_accounts pa WHERE pa.client_id = c.id) AS platform_count,
  (SELECT COUNT(*) FROM public.campaigns cam WHERE cam.client_id = c.id) AS campaign_count,
  (SELECT COALESCE(SUM(dm.spend), 0) FROM public.daily_metrics dm WHERE dm.client_id = c.id AND dm.metric_date >= CURRENT_DATE - 30) AS total_spend_30d,
  (SELECT AVG(dm.roas) FROM public.daily_metrics dm WHERE dm.client_id = c.id AND dm.metric_date >= CURRENT_DATE - 30) AS avg_roas,
  (SELECT MAX(dm.metric_date) FROM public.daily_metrics dm WHERE dm.client_id = c.id) AS last_metric_date
FROM public.dashboard_clients c;

CREATE OR REPLACE VIEW public.alert_summary
WITH (security_invoker = true) AS
SELECT client_id, severity, COUNT(*) AS alert_count
FROM public.alerts
WHERE is_resolved = false
GROUP BY client_id, severity;

ALTER TABLE IF EXISTS public.dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dashboard_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ad_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.variation_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manual_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ad_connections ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.dashboard_users, public.dashboard_sessions, public.dashboard_clients,
  public.platform_accounts, public.campaigns, public.daily_metrics, public.ad_variations,
  public.variation_performance, public.optimization_runs, public.alerts, public.manual_actions,
  public.invoices, public.invoice_items, public.client_settings, public.api_logs,
  public.keywords, public.keyword_performance, public.ad_connections,
  public.client_summary, public.alert_summary
FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.dashboard_users, public.dashboard_sessions, public.dashboard_clients,
  public.platform_accounts, public.campaigns, public.daily_metrics, public.ad_variations,
  public.variation_performance, public.optimization_runs, public.alerts, public.manual_actions,
  public.invoices, public.invoice_items, public.client_settings, public.api_logs,
  public.keywords, public.keyword_performance, public.ad_connections
TO service_role;
GRANT SELECT ON public.client_summary, public.alert_summary TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
