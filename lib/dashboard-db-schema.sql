-- =========================================
-- INTERNAL DASHBOARD DATABASE SCHEMA
-- Multi-client campaign management system
-- =========================================

-- =========================================
-- 1. AUTHENTICATION & USERS
-- =========================================

CREATE TABLE dashboard_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'operator', -- operator, admin, super_admin
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE dashboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES dashboard_users(id),
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 2. CLIENTS MANAGEMENT
-- =========================================

CREATE TABLE dashboard_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, inactive
  monthly_fee DECIMAL(10,2) DEFAULT 300.00,
  ad_spend_budget DECIMAL(10,2) DEFAULT 500.00,
  website_url VARCHAR(255),
  api_key VARCHAR(500) UNIQUE NOT NULL, -- For API access
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by UUID REFERENCES dashboard_users(id)
);

-- =========================================
-- 3. PLATFORM ACCOUNTS (Google, Meta, Yelp)
-- =========================================

CREATE TABLE platform_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  platform VARCHAR(50) NOT NULL, -- google_ads, meta_ads, yelp
  account_id VARCHAR(255) NOT NULL,
  account_email VARCHAR(255),
  access_token VARCHAR(1000),
  refresh_token VARCHAR(1000),
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMP,
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, platform, account_id)
);

-- =========================================
-- 4. CAMPAIGNS & PERFORMANCE
-- =========================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  platform VARCHAR(50) NOT NULL,
  campaign_id VARCHAR(255) NOT NULL,
  campaign_name VARCHAR(255),
  status VARCHAR(50), -- ENABLED, PAUSED, REMOVED
  daily_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,

  UNIQUE(client_id, platform, campaign_id)
);

CREATE TABLE daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  campaign_id UUID REFERENCES campaigns(id),
  platform VARCHAR(50) NOT NULL,
  metric_date DATE NOT NULL,
  spend DECIMAL(12,2),
  clicks INTEGER,
  impressions INTEGER,
  conversions INTEGER,
  cost_per_conversion DECIMAL(10,2),
  click_through_rate DECIMAL(5,2),
  cost_per_click DECIMAL(10,2),
  roas DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, campaign_id, platform, metric_date)
);

CREATE INDEX idx_daily_metrics_client_date ON daily_metrics(client_id, metric_date);
CREATE INDEX idx_daily_metrics_campaign ON daily_metrics(campaign_id);

-- =========================================
-- 5. AD VARIATIONS & TESTING
-- =========================================

CREATE TABLE ad_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  platform VARCHAR(50) NOT NULL,
  variation_type VARCHAR(50), -- price, urgency, quality, trust, convenience
  headline_en VARCHAR(255),
  headline_es VARCHAR(255),
  description_en TEXT,
  description_es TEXT,
  cta_en VARCHAR(100),
  cta_es VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, archived
  performance_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by UUID REFERENCES dashboard_users(id)
);

CREATE TABLE variation_performance (
  id BIGSERIAL PRIMARY KEY,
  variation_id UUID NOT NULL REFERENCES ad_variations(id),
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(variation_id, date)
);

-- =========================================
-- 6. OPTIMIZATION HISTORY
-- =========================================

CREATE TABLE optimization_runs (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  run_date TIMESTAMP NOT NULL,
  run_type VARCHAR(50), -- daily, manual, emergency
  budget_allocation JSONB,
  metrics JSONB,
  anomalies JSONB,
  recommendations JSONB,
  bid_adjustments JSONB,
  actions_taken JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_optimization_runs_client_date ON optimization_runs(client_id, run_date);

-- =========================================
-- 7. ALERTS & NOTIFICATIONS
-- =========================================

CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  alert_type VARCHAR(50), -- anomaly, threshold, opportunity, error
  severity VARCHAR(50), -- CRITICAL, WARNING, INFO
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_required VARCHAR(255),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_client_unresolved ON alerts(client_id, is_resolved);

-- =========================================
-- 8. MANUAL INTERVENTIONS LOG
-- =========================================

CREATE TABLE manual_actions (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  user_id UUID NOT NULL REFERENCES dashboard_users(id),
  action_type VARCHAR(50), -- bid_adjustment, pause_ad, add_keyword, create_ad
  platform VARCHAR(50),
  campaign_id UUID REFERENCES campaigns(id),
  details JSONB,
  before_value JSONB,
  after_value JSONB,
  status VARCHAR(50), -- pending, applied, failed
  result_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP
);

-- =========================================
-- 9. BILLING & REVENUE
-- =========================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  website_fee DECIMAL(10,2),
  maintenance_fee DECIMAL(10,2),
  ad_spend DECIMAL(10,2),
  total_amount DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, paid, overdue
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE invoice_items (
  id BIGSERIAL PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  description VARCHAR(255),
  amount DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- 10. SETTINGS & PREFERENCES
-- =========================================

CREATE TABLE client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  alert_threshold_cpc DECIMAL(5,2), -- Alert if CPC increases by this %
  alert_threshold_ctr DECIMAL(5,2),
  auto_pause_threshold DECIMAL(10,2), -- Auto-pause ads if ROAS below this
  preferred_contact_method VARCHAR(50), -- email, phone, sms
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
  settings_json JSONB, -- Custom settings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- =========================================
-- 11. API LOGS (For audit trail)
-- =========================================

CREATE TABLE api_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES dashboard_users(id),
  client_id UUID REFERENCES dashboard_clients(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  request_data JSONB,
  response_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user_client ON api_logs(user_id, client_id, created_at);

-- =========================================
-- 12. KEYWORD MANAGEMENT
-- =========================================

CREATE TABLE keywords (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES dashboard_clients(id),
  platform VARCHAR(50) NOT NULL,
  keyword_text VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, archived
  bid_amount DECIMAL(10,2),
  match_type VARCHAR(50), -- exact, phrase, broad
  quality_score INTEGER, -- For Google Ads
  avg_monthly_searches INTEGER,
  competition_level VARCHAR(50), -- low, medium, high
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,

  UNIQUE(client_id, platform, keyword_text)
);

CREATE TABLE keyword_performance (
  id BIGSERIAL PRIMARY KEY,
  keyword_id BIGINT NOT NULL REFERENCES keywords(id),
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(keyword_id, date)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

CREATE INDEX idx_campaigns_client ON campaigns(client_id);
CREATE INDEX idx_platform_accounts_client ON platform_accounts(client_id);
CREATE INDEX idx_ad_variations_client ON ad_variations(client_id);
CREATE INDEX idx_keywords_client ON keywords(client_id);
CREATE INDEX idx_manual_actions_client ON manual_actions(client_id, created_at);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- =========================================
-- VIEWS FOR COMMON QUERIES
-- =========================================

CREATE VIEW client_summary AS
SELECT
  c.id,
  c.client_name,
  c.status,
  COUNT(DISTINCT pa.id) as platform_count,
  COUNT(DISTINCT cam.id) as campaign_count,
  SUM(dm.spend) as total_spend_30d,
  AVG(dm.roas) as avg_roas,
  MAX(dm.metric_date) as last_metric_date
FROM dashboard_clients c
LEFT JOIN platform_accounts pa ON c.id = pa.client_id
LEFT JOIN campaigns cam ON c.id = cam.client_id
LEFT JOIN daily_metrics dm ON c.id = dm.client_id AND dm.metric_date >= CURRENT_DATE - 30
GROUP BY c.id, c.client_name, c.status;

CREATE VIEW alert_summary AS
SELECT
  client_id,
  severity,
  COUNT(*) as alert_count
FROM alerts
WHERE is_resolved = false
GROUP BY client_id, severity;
