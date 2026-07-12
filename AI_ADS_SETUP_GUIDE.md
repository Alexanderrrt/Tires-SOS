# 🤖 AI-Driven Ads Integration Setup Guide

This guide walks you through setting up automated ad optimization with AI.

## 📋 What You Now Have

- **AI Ad Generator** — Generates 5 bilingual ad variations daily
- **Budget Optimizer** — Allocates $500/month based on ROAS
- **Daily Cron Job** — Runs at 9 AM automatically
- **Email Reports** — HTML reports with metrics & recommendations
- **Database Storage** — Saves all optimization history (optional)

---

## 🚀 Installation (20 minutes)

### Step 1: Install Dependencies

```bash
npm install \
  google-ads-api \
  facebook-nodejs-business-sdk \
  nodemailer \
  @anthropic-ai/sdk \
  @supabase/supabase-js
```

### Step 2: Get API Credentials

#### Google Ads API
1. Go to: https://developers.google.com/google-ads/api/docs/start
2. Create a project in Google Cloud Console
3. Enable Google Ads API
4. Create OAuth 2.0 credentials (Desktop app)
5. Get Developer Token from Google Ads account
6. Save: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN`

#### Meta (Facebook) Ads API
1. Go to: https://developers.facebook.com/apps
2. Create a new app (Business type)
3. Go to Marketing API
4. Get your Access Token (never expires: use "System User")
5. Get Ad Account ID from Meta Ads Manager
6. Get Facebook Page ID
7. Save: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`

#### Claude AI API
1. Go to: https://console.anthropic.com/
2. Create API key
3. Save: `ANTHROPIC_API_KEY`

#### Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select: Mail, Windows (or your device)
3. Generate app-specific password
4. Save: `EMAIL_USER`, `EMAIL_PASSWORD`

#### Cron Secret
```bash
# Generate random secret
openssl rand -hex 32
# Result looks like: a3f8e9c2b1d4e7f0...
```

### Step 3: Configure Environment Variables

Copy to `.env.local`:

```bash
# Cron
CRON_SECRET=your-random-hex-string

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
NOTIFY_EMAIL_RECIPIENT=owner@tiressos.com

# Google Ads
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_DEVELOPER_TOKEN=xxx
GOOGLE_REFRESH_TOKEN=xxx
GOOGLE_CUSTOMER_ID=1234567890

# Meta
META_ACCESS_TOKEN=xxx
META_AD_ACCOUNT_ID=act_123456789
META_PAGE_ID=xxx

# Claude
ANTHROPIC_API_KEY=sk-ant-xxx

# Supabase (optional)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Step 4: Setup Cron Job

**Option A: Using vercel.ts (Recommended)**

Create `vercel.ts`:

```typescript
import { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  crons: [
    {
      path: '/api/cron/optimize-ads',
      schedule: '0 9 * * *', // 9 AM PST daily
    }
  ]
};
```

**Option B: Using vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/optimize-ads",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Step 5: Create Database Tables (Optional)

If using Supabase, run these SQL commands:

```sql
-- Optimization runs table
CREATE TABLE ad_optimization_runs (
  id BIGSERIAL PRIMARY KEY,
  run_date TIMESTAMP NOT NULL,
  budget_allocation JSONB NOT NULL,
  metrics JSONB NOT NULL,
  recommendations JSONB,
  ad_variations JSONB,
  underperformers JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ad performance metrics table
CREATE TABLE ad_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  spend DECIMAL(10,2),
  clicks INTEGER,
  conversions INTEGER,
  impressions INTEGER,
  ctr DECIMAL(5,2),
  avg_cpc DECIMAL(10,2),
  roas DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ad variations table
CREATE TABLE ad_variations (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,
  headline_en VARCHAR(255),
  headline_es VARCHAR(255),
  description_en TEXT,
  description_es TEXT,
  variation_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  performance_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_optimization_runs_date ON ad_optimization_runs(run_date);
CREATE INDEX idx_ad_metrics_platform_date ON ad_performance_metrics(platform, date);
CREATE INDEX idx_variations_status ON ad_variations(status);
```

---

## ✅ Testing Setup

### Test Cron Job Manually

```bash
# In your terminal
curl -X POST https://your-site.vercel.app/api/cron/optimize-ads \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Daily optimization completed",
  "data": {
    "budgetOptimization": { ... },
    "adVariationsGenerated": 5,
    "reportSent": true,
    "duration": "3421ms"
  }
}
```

### Test Email

Send test email from command line:

```bash
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.NOTIFY_EMAIL_RECIPIENT,
  subject: 'Test Email',
  text: 'This is a test!'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Email sent:', info.response);
});
"
```

### Test AI Ad Generator

```bash
node -e "
const { generateAdVariations } = require('./lib/ai-ad-generator.js');
generateAdVariations('tire-sales', 'local-searchers')
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(err => console.error(err));
"
```

---

## 📊 File Structure

```
lib/
├── ai-ad-generator.js           # Claude API for ad copy
├── google-ads-api.js            # Google Ads integration
├── meta-ads-api.js              # Meta/Facebook ads integration
├── budget-optimizer.js          # ROAS-based budget allocation
├── send-report.js               # Email notifications
├── report-template.js           # HTML email templates
├── supabase-client.js           # Database functions

app/api/cron/
└── optimize-ads/
    └── route.js                 # Daily cron job (9 AM)
```

---

## 🔄 Daily Workflow

**9:00 AM PST** — Cron job runs automatically:

1. ✅ Fetch metrics from Google, Meta, Yelp
2. ✅ Calculate ROAS for each platform
3. ✅ Reallocate $500 budget based on performance
4. ✅ Generate 5 new ad variations to test
5. ✅ Identify underperforming ads to pause
6. ✅ Send HTML report to your email
7. ✅ Save results to Supabase (optional)

**You receive email with:**
- Budget reallocation breakdown
- New ad variations to test
- Underperforming keywords to pause
- Performance metrics & ROAS
- AI recommendations for next steps

---

## 📈 What Gets Optimized

### Budget Allocation ($ out of $500/month)

Uses ROAS formula:
```
Platform Budget = (Platform ROAS / Total ROAS) × $500
```

Example:
- Google ROAS: 0.20 (20 conversions from $100 spend)
- Meta ROAS: 0.15 (15 conversions from $100 spend)
- Yelp ROAS: 0.12 (12 conversions from $100 spend)
- Total: 0.47 ROAS

New allocation:
- Google: (0.20/0.47) × $500 = $213
- Meta: (0.15/0.47) × $500 = $160
- Yelp: (0.12/0.47) × $500 = $127

### Ad Variations Generated

5 different angles for testing:
1. **Price-focused** — "40% OFF This Week"
2. **Urgency-focused** — "Limited Appointment Slots"
3. **Quality-focused** — "Professional Installation"
4. **Trust-focused** — "20 Years Experience"
5. **Convenience-focused** — "Same-Day Service"

Each has EN/ES headlines and descriptions.

### Underperformers Identified

Campaigns paused if:
- ROAS < 0.05 (losing money)
- CTR < 2% (not resonating)
- CPC > $5 (too expensive)

---

## 🚨 Common Issues & Fixes

### "Unauthorized cron request"
- Verify `CRON_SECRET` is correct
- Make sure it's set in Vercel environment variables
- Use correct header: `Authorization: Bearer YOUR_SECRET`

### "Email not sending"
- Verify Gmail App Password (not regular password)
- Check 2FA is enabled: https://myaccount.google.com/security
- Allow "Less secure apps": https://myaccount.google.com/lesssecureapps

### "Google Ads API error: PERMISSION_DENIED"
- Verify `GOOGLE_DEVELOPER_TOKEN` is approved
- Check account is MCC (Manager) account
- Ensure refresh token is valid (expires every 6 months)

### "Meta API rate limited"
- This rarely happens with 1 daily run
- If it does, space out requests in the cron job
- Default should be fine for $500/month spend

### "No conversions showing"
- Make sure conversion tracking is set up
- Google Ads: Check conversion actions
- Meta: Check Facebook Pixel installed
- May take 24-48 hours for data to populate

---

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Cron | Free | 1 job/day is free |
| Google Ads API | Free | Included with Google Ads account |
| Meta API | Free | Included with Meta account |
| Claude AI | ~$5-10/mo | ~1,000 tokens/day for ad generation |
| Gmail | Free | App password is free |
| Supabase | $0-15/mo | Optional; free tier has enough for this |
| **Total** | **~$10-20/mo** | Very cheap for full automation |

---

## 📚 Documentation Links

- [Google Ads API Docs](https://developers.google.com/google-ads/api)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-api)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Vercel Cron Jobs](https://vercel.com/docs/crons)
- [Supabase Docs](https://supabase.com/docs)

---

## 🎯 Next Steps

1. ✅ Install all dependencies
2. ✅ Get API credentials
3. ✅ Set up `.env.local`
4. ✅ Deploy to Vercel
5. ✅ Create Supabase tables (optional)
6. ✅ Test cron job manually
7. ✅ Wait for first automated run at 9 AM

**That's it!** From now on, ads get optimized automatically every day. 🚀
