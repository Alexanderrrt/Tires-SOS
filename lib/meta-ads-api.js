/**
 * Meta (Facebook/Instagram) Marketing API wrapper (Graph API, REST) backed by
 * the credentials stored in lib/ad-connections-store.js. Falls back to
 * labeled mock data when the connection isn't configured yet.
 */

const API_VERSION = "v23.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function unavailableMetrics(reason, error = null) {
  return {
    platform: "meta",
    available: false,
    reason,
    error,
    spend: 0,
    conversions: 0,
    conversionsValue: 0,
    clicks: 0,
    impressions: 0,
    ctr: 0,
    avgCpc: 0,
    roas: 0,
    campaigns: [],
    daily: [],
    lastUpdated: new Date().toISOString(),
  };
}

function dateRange(days = 30) {
  const normalizedDays = Math.min(90, Math.max(1, Number.parseInt(days, 10) || 30));
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - normalizedDays + 1);
  return { since: since.toISOString().slice(0, 10), until: until.toISOString().slice(0, 10) };
}

function fieldsFromConnection(connection) {
  const f = connection?.fields || {};
  const adAccountId = String(f.ad_account_id || "").trim();
  return {
    adAccountId: adAccountId.startsWith("act_") ? adAccountId : adAccountId ? `act_${adAccountId}` : "",
    accessToken: f.access_token,
  };
}

function isConfigured(connection) {
  const { adAccountId, accessToken } = fieldsFromConnection(connection);
  return Boolean(connection?.connected && adAccountId && accessToken);
}

function conversionValue(actionValues) {
  if (!Array.isArray(actionValues)) return 0;
  const purchase = actionValues.find((a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
  return purchase ? Number(purchase.value || 0) : 0;
}

function conversionCount(actions) {
  if (!Array.isArray(actions)) return 0;
  const purchase = actions.find((a) => a.action_type === "purchase" || a.action_type === "lead" || a.action_type === "offsite_conversion.fb_pixel_purchase");
  return purchase ? Number(purchase.value || 0) : 0;
}

async function graphGet(path, accessToken, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) throw new Error(`Meta Graph API GET ${path} failed: ${data?.error?.message || res.status}`);
  return data;
}

async function graphPost(path, accessToken, body) {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("access_token", accessToken);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Meta Graph API POST ${path} failed: ${data?.error?.message || res.status}`);
  return data;
}

export async function getDeviceBreakdown(connection) {
  if (!isConfigured(connection)) return [];
  try {
    const { adAccountId, accessToken } = fieldsFromConnection(connection);
    const data = await graphGet(`/${adAccountId}/insights`, accessToken, {
      fields: "spend,clicks,actions",
      breakdowns: "device_platform",
      date_preset: "last_30d",
      level: "account",
    });
    return (data.data || []).map((row) => ({
      device: row.device_platform || "unknown",
      clicks: Number(row.clicks || 0),
      conversions: conversionCount(row.actions),
      cost: Number(row.spend || 0),
    }));
  } catch (error) {
    console.error("getDeviceBreakdown (Meta) error:", error.message);
    return [];
  }
}

export async function getMetaAdsMetrics(connection, { days = 30 } = {}) {
  if (!isConfigured(connection)) return unavailableMetrics("Meta Ads connection not configured");

  try {
    const { adAccountId, accessToken } = fieldsFromConnection(connection);
    const range = dateRange(days);
    const common = { time_range: JSON.stringify(range), limit: "500" };
    const [campaignData, dailyData] = await Promise.all([
      graphGet(`/${adAccountId}/insights`, accessToken, {
        ...common,
        level: "campaign",
        fields: "campaign_id,campaign_name,spend,clicks,impressions,actions,action_values",
      }),
      graphGet(`/${adAccountId}/insights`, accessToken, {
        ...common,
        level: "account",
        time_increment: "1",
        fields: "date_start,date_stop,spend,clicks,impressions,actions,action_values",
      }),
    ]);

    const campaigns = (campaignData.data || []).map((insight) => {
      const spend = Number(insight.spend || 0);
      const value = conversionValue(insight.action_values);
      return {
        id: insight.campaign_id,
        name: insight.campaign_name || "Unnamed campaign",
        spend,
        conversions: conversionCount(insight.actions),
        conversionsValue: value,
        clicks: Number(insight.clicks || 0),
        impressions: Number(insight.impressions || 0),
        roas: spend > 0 ? value / spend : 0,
      };
    });

    const daily = (dailyData.data || []).map((insight) => ({
      date: insight.date_start,
      spend: Number(insight.spend || 0),
      conversions: conversionCount(insight.actions),
      conversionsValue: conversionValue(insight.action_values),
      clicks: Number(insight.clicks || 0),
      impressions: Number(insight.impressions || 0),
    }));
    const spend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const conversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
    const conversionsValue = campaigns.reduce((sum, campaign) => sum + campaign.conversionsValue, 0);
    const clicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const impressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);

    return {
      platform: "meta",
      available: true,
      spend,
      conversions,
      conversionsValue,
      clicks,
      impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? conversionsValue / spend : 0,
      campaigns: campaigns.sort((a, b) => b.spend - a.spend),
      daily: daily.sort((a, b) => a.date.localeCompare(b.date)),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getMetaAdsMetrics error:", error.message);
    return unavailableMetrics("Meta Marketing API request failed", error.message);
  }
}

/**
 * newBudgetCents: daily budget in cents (Meta's smallest currency unit for USD)
 */
export async function updateCampaignBudget(connection, campaignId, newBudgetCents) {
  if (!isConfigured(connection)) return { success: false, error: "Meta Ads connection not configured" };
  try {
    const { accessToken } = fieldsFromConnection(connection);
    await graphPost(`/${campaignId}`, accessToken, { daily_budget: Math.round(newBudgetCents) });
    return { success: true, campaignId, newBudgetCents };
  } catch (error) {
    console.error("updateCampaignBudget (Meta) error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function pauseAd(connection, adId) {
  if (!isConfigured(connection)) return { success: false, error: "Meta Ads connection not configured" };
  try {
    const { accessToken } = fieldsFromConnection(connection);
    await graphPost(`/${adId}`, accessToken, { status: "PAUSED" });
    return { success: true, adId };
  } catch (error) {
    console.error("pauseAd error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function pauseCampaign(connection, campaignId) {
  if (!isConfigured(connection)) return { success: false, error: "Meta Ads connection not configured" };
  try {
    const { accessToken } = fieldsFromConnection(connection);
    await graphPost(`/${campaignId}`, accessToken, { status: "PAUSED" });
    return { success: true, campaignId };
  } catch (error) {
    console.error("pauseCampaign (Meta) error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getTopAds(connection, limit = 5) {
  if (!isConfigured(connection)) return [];
  try {
    const { adAccountId, accessToken } = fieldsFromConnection(connection);
    const data = await graphGet(`/${adAccountId}/ads`, accessToken, {
      fields: "id,name,insights.date_preset(last_30d){spend,actions,action_values}",
      limit: 200,
    });
    return (data.data || [])
      .map((a) => {
        const insight = a.insights?.data?.[0] || {};
        const spend = Number(insight.spend || 0);
        const value = conversionValue(insight.action_values);
        return {
          adId: a.id,
          name: a.name,
          spend,
          conversions: conversionCount(insight.actions),
          roas: spend > 0 ? value / spend : 0,
        };
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, limit);
  } catch (error) {
    console.error("getTopAds error:", error.message);
    return [];
  }
}

export async function createCreative(connection, creativeData) {
  if (!isConfigured(connection)) return { success: false, error: "Meta Ads connection not configured" };
  try {
    const { adAccountId, accessToken } = fieldsFromConnection(connection);
    const data = await graphPost(`/${adAccountId}/adcreatives`, accessToken, creativeData);
    return { success: true, creativeId: data.id };
  } catch (error) {
    console.error("createCreative error:", error.message);
    return { success: false, error: error.message };
  }
}
