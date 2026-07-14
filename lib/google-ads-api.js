/**
 * Google Ads API wrapper (REST, v17) backed by the credentials stored in
 * lib/ad-connections-store.js. Falls back to labeled mock data when the
 * connection isn't configured yet, so callers never have to special-case it.
 */

const API_VERSION = "v17";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

function mockMetrics(reason) {
  return {
    platform: "google",
    mocked: true,
    mockReason: reason,
    spend: 250,
    conversions: 45,
    conversionsValue: 75,
    clicks: 1500,
    impressions: 25000,
    ctr: 6,
    avgCpc: 0.17,
    roas: 0.3,
    campaigns: [],
    lastUpdated: new Date().toISOString(),
  };
}

function fieldsFromConnection(connection) {
  const f = connection?.fields || {};
  const customerId = String(f.customer_id || "").replace(/-/g, "").trim();
  return {
    customerId,
    developerToken: f.developer_token,
    clientId: f.client_id,
    clientSecret: f.client_secret,
    refreshToken: f.refresh_token,
  };
}

function isConfigured(connection) {
  const { customerId, developerToken, clientId, clientSecret, refreshToken } = fieldsFromConnection(connection);
  return Boolean(connection?.connected && customerId && developerToken && clientId && clientSecret && refreshToken);
}

async function getAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth token refresh failed: ${data.error_description || data.error || res.status}`);
  return data.access_token;
}

async function gaqlSearch({ customerId, developerToken, accessToken }, query) {
  const res = await fetch(`${BASE_URL}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": customerId,
    },
    body: JSON.stringify({ query, pageSize: 1000 }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    throw new Error(`Google Ads API search failed: ${message}`);
  }
  return data.results || [];
}

async function gaqlMutate({ customerId, developerToken, accessToken }, resource, operations) {
  const res = await fetch(`${BASE_URL}/customers/${customerId}/${resource}:mutate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": customerId,
    },
    body: JSON.stringify({ operations }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    throw new Error(`Google Ads API mutate (${resource}) failed: ${message}`);
  }
  return data;
}

async function authedContext(connection) {
  const fields = fieldsFromConnection(connection);
  const accessToken = await getAccessToken(fields);
  return { ...fields, accessToken };
}

/**
 * connection: the `google_ads` entry from getAdConnections() — { connected, fields }
 */
export async function getGoogleAdsMetrics(connection) {
  if (!isConfigured(connection)) return mockMetrics("Google Ads connection not configured");

  try {
    const ctx = await authedContext(connection);
    const rows = await gaqlSearch(
      ctx,
      `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      `
    );

    const campaigns = rows.map((r) => {
      const spend = Number(r.metrics?.costMicros || 0) / 1_000_000;
      const conversionsValue = Number(r.metrics?.conversionsValue || 0);
      return {
        id: r.campaign?.id,
        name: r.campaign?.name,
        status: r.campaign?.status,
        spend,
        conversions: Number(r.metrics?.conversions || 0),
        clicks: Number(r.metrics?.clicks || 0),
        impressions: Number(r.metrics?.impressions || 0),
        roas: spend > 0 ? conversionsValue / spend : 0,
      };
    });

    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const conversionsValue = rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0);

    return {
      platform: "google",
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
    console.error("getGoogleAdsMetrics error:", error.message);
    return { ...mockMetrics(error.message), error: error.message };
  }
}

/**
 * newBudgetMicros: daily budget in micros (dollars * 1_000_000)
 */
export async function updateCampaignBudget(connection, campaignBudgetResourceName, newBudgetMicros) {
  if (!isConfigured(connection)) {
    return { success: false, error: "Google Ads connection not configured" };
  }
  try {
    const ctx = await authedContext(connection);
    await gaqlMutate(ctx, "campaignBudgets", [
      {
        update: { resourceName: campaignBudgetResourceName, amountMicros: String(Math.round(newBudgetMicros)) },
        updateMask: "amountMicros",
      },
    ]);
    return { success: true, resourceName: campaignBudgetResourceName, newBudgetMicros };
  } catch (error) {
    console.error("updateCampaignBudget (Google) error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function pauseCampaign(connection, campaignResourceName) {
  if (!isConfigured(connection)) return { success: false, error: "Google Ads connection not configured" };
  try {
    const ctx = await authedContext(connection);
    await gaqlMutate(ctx, "campaigns", [
      { update: { resourceName: campaignResourceName, status: "PAUSED" }, updateMask: "status" },
    ]);
    return { success: true, resourceName: campaignResourceName };
  } catch (error) {
    console.error("pauseCampaign (Google) error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getDeviceBreakdown(connection) {
  if (!isConfigured(connection)) return [];
  try {
    const ctx = await authedContext(connection);
    const rows = await gaqlSearch(
      ctx,
      `
      SELECT segments.device, metrics.clicks, metrics.conversions, metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      `
    );
    const byDevice = {};
    for (const r of rows) {
      const device = r.segments?.device || "UNKNOWN";
      const bucket = (byDevice[device] ||= { device, clicks: 0, conversions: 0, cost: 0 });
      bucket.clicks += Number(r.metrics?.clicks || 0);
      bucket.conversions += Number(r.metrics?.conversions || 0);
      bucket.cost += Number(r.metrics?.costMicros || 0) / 1_000_000;
    }
    return Object.values(byDevice);
  } catch (error) {
    console.error("getDeviceBreakdown (Google) error:", error.message);
    return [];
  }
}

export async function getHourBreakdown(connection) {
  if (!isConfigured(connection)) return [];
  try {
    const ctx = await authedContext(connection);
    const rows = await gaqlSearch(
      ctx,
      `
      SELECT segments.hour, metrics.clicks, metrics.conversions, metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      `
    );
    const byHour = {};
    for (const r of rows) {
      const hour = r.segments?.hour ?? -1;
      const bucket = (byHour[hour] ||= { hour, clicks: 0, conversions: 0, cost: 0 });
      bucket.clicks += Number(r.metrics?.clicks || 0);
      bucket.conversions += Number(r.metrics?.conversions || 0);
      bucket.cost += Number(r.metrics?.costMicros || 0) / 1_000_000;
    }
    return Object.values(byHour).sort((a, b) => a.hour - b.hour);
  } catch (error) {
    console.error("getHourBreakdown (Google) error:", error.message);
    return [];
  }
}

export async function getTopKeywords(connection, limit = 10) {
  if (!isConfigured(connection)) {
    return [
      { keyword: "emergency tire repair", volume: 450, competitiveness: 0.4 },
      { keyword: "tire shop near me", volume: 380, competitiveness: 0.6 },
    ];
  }
  try {
    const ctx = await authedContext(connection);
    const rows = await gaqlSearch(
      ctx,
      `
      SELECT ad_group_criterion.keyword.text, metrics.clicks, metrics.impressions, metrics.cost_micros
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.clicks DESC
      LIMIT ${limit}
      `
    );
    return rows.map((r) => ({
      keyword: r.adGroupCriterion?.keyword?.text,
      clicks: Number(r.metrics?.clicks || 0),
      impressions: Number(r.metrics?.impressions || 0),
      spend: Number(r.metrics?.costMicros || 0) / 1_000_000,
    }));
  } catch (error) {
    console.error("getTopKeywords error:", error.message);
    return [];
  }
}

export async function pauseKeyword(connection, adGroupCriterionResourceName) {
  if (!isConfigured(connection)) return { success: false, error: "Google Ads connection not configured" };
  try {
    const ctx = await authedContext(connection);
    await gaqlMutate(ctx, "adGroupCriteria", [
      { update: { resourceName: adGroupCriterionResourceName, status: "PAUSED" }, updateMask: "status" },
    ]);
    return { success: true, resourceName: adGroupCriterionResourceName };
  } catch (error) {
    console.error("pauseKeyword error:", error.message);
    return { success: false, error: error.message };
  }
}
