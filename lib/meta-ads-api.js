/**
 * Meta (Facebook/Instagram) Marketing API wrapper (Graph API, REST) backed by
 * the credentials stored in lib/ad-connections-store.js. Falls back to
 * labeled mock data when the connection isn't configured yet.
 */

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function mockMetrics(reason) {
  return {
    platform: "meta",
    mocked: true,
    mockReason: reason,
    spend: 139,
    conversions: 20,
    conversionsValue: 20.85,
    clicks: 620,
    impressions: 12000,
    ctr: 5.17,
    avgCpc: 0.22,
    roas: 0.15,
    campaigns: [],
    lastUpdated: new Date().toISOString(),
  };
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

export async function getMetaAdsMetrics(connection) {
  if (!isConfigured(connection)) return mockMetrics("Meta Ads connection not configured");

  try {
    const { adAccountId, accessToken } = fieldsFromConnection(connection);

    const campaignData = await graphGet(`/${adAccountId}/campaigns`, accessToken, {
      fields: "id,name,status,insights.date_preset(last_30d){spend,clicks,impressions,ctr,actions,action_values}",
      limit: 200,
    });

    const campaigns = (campaignData.data || []).map((c) => {
      const insight = c.insights?.data?.[0] || {};
      const spend = Number(insight.spend || 0);
      const value = conversionValue(insight.action_values);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        spend,
        conversions: conversionCount(insight.actions),
        clicks: Number(insight.clicks || 0),
        impressions: Number(insight.impressions || 0),
        roas: spend > 0 ? value / spend : 0,
      };
    });

    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const conversionsValue = campaigns.reduce((s, c) => s + (c.roas * c.spend || 0), 0);

    return {
      platform: "meta",
      mocked: false,
      spend,
      conversions,
      conversionsValue,
      clicks,
      impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? conversionsValue / spend : 0,
      campaigns: campaigns.sort((a, b) => b.spend - a.spend),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getMetaAdsMetrics error:", error.message);
    return { ...mockMetrics(error.message), error: error.message };
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
  if (!isConfigured(connection)) {
    return [
      { adId: "ad_1", spend: 45, conversions: 8, roas: 0.18 },
      { adId: "ad_2", spend: 38, conversions: 6, roas: 0.16 },
    ];
  }
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
