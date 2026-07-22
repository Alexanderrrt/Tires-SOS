/**
 * Google Ads API wrapper (REST, v24) backed by the credentials stored in
 * lib/ad-connections-store.js. Unavailable accounts return explicit zero-data
 * states so dashboard totals and optimization decisions never use fake data.
 */

const API_VERSION = "v24";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

function unavailableMetrics(reason, error = null) {
  return {
    platform: "google",
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
  const customerId = String(f.customer_id || "").replace(/-/g, "").trim();
  const loginCustomerId = String(f.login_customer_id || "").replace(/-/g, "").trim();
  return {
    customerId,
    loginCustomerId,
    developerToken: f.developer_token,
    clientId: f.client_id,
    clientSecret: f.client_secret,
    refreshToken: f.refresh_token,
  };
}

function requestHeaders({ developerToken, accessToken, loginCustomerId }) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
  };
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId;
  return headers;
}

function googleApiError(data, fallbackStatus) {
  const topLevel = data?.error?.message || `HTTP ${fallbackStatus}`;
  const failures = (data?.error?.details || []).flatMap((detail) => detail?.errors || []);
  const specifics = failures.map((failure) => {
    const code = Object.values(failure?.errorCode || {}).find(Boolean);
    const path = (failure?.location?.fieldPathElements || [])
      .map((element) => element?.fieldName)
      .filter(Boolean)
      .join(".");
    return [code, failure?.message, path ? `at ${path}` : null].filter(Boolean).join(": ");
  });
  const requestId = (data?.error?.details || []).find((detail) => detail?.requestId)?.requestId;
  return [topLevel, ...specifics, requestId ? `Request ID: ${requestId}` : null]
    .filter(Boolean)
    .join(" — ");
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

async function gaqlSearch(ctx, query) {
  const results = [];
  let pageToken;
  do {
    const res = await fetch(`${BASE_URL}/customers/${ctx.customerId}/googleAds:search`, {
      method: "POST",
      headers: requestHeaders(ctx),
      // SearchGoogleAdsRequest.pageSize is rejected in current API versions.
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Google Ads API search failed: ${googleApiError(data, res.status)}`);
    }
    results.push(...(data.results || []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return results;
}

async function gaqlMutate(ctx, resource, operations) {
  const res = await fetch(`${BASE_URL}/customers/${ctx.customerId}/${resource}:mutate`, {
    method: "POST",
    headers: requestHeaders(ctx),
    body: JSON.stringify({ operations }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google Ads API mutate (${resource}) failed: ${googleApiError(data, res.status)}`);
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
export async function getGoogleAdsMetrics(connection, { days = 30 } = {}) {
  if (!isConfigured(connection)) return unavailableMetrics("Google Ads connection not configured");

  try {
    const ctx = await authedContext(connection);
    const range = dateRange(days);
    const rows = await gaqlSearch(
      ctx,
      `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.campaign_budget,
        segments.date,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.clicks,
        metrics.impressions
      FROM campaign
      WHERE segments.date BETWEEN '${range.since}' AND '${range.until}'
      `
    );

    const campaignMap = new Map();
    const dailyMap = new Map();
    for (const r of rows) {
      const spend = Number(r.metrics?.costMicros || 0) / 1_000_000;
      const conversionsValue = Number(r.metrics?.conversionsValue || 0);
      const conversions = Number(r.metrics?.conversions || 0);
      const clicks = Number(r.metrics?.clicks || 0);
      const impressions = Number(r.metrics?.impressions || 0);
      const campaignId = String(r.campaign?.id || "unknown");
      const campaign = campaignMap.get(campaignId) || {
        id: campaignId,
        budgetResourceName: r.campaign?.campaignBudget || null,
        name: r.campaign?.name || "Unnamed campaign",
        status: r.campaign?.status || "UNKNOWN",
        spend: 0,
        conversions: 0,
        conversionsValue: 0,
        clicks: 0,
        impressions: 0,
        roas: 0,
      };
      campaign.spend += spend;
      campaign.conversions += conversions;
      campaign.conversionsValue += conversionsValue;
      campaign.clicks += clicks;
      campaign.impressions += impressions;
      campaign.roas = campaign.spend > 0 ? campaign.conversionsValue / campaign.spend : 0;
      campaignMap.set(campaignId, campaign);

      const date = r.segments?.date;
      if (date) {
        const day = dailyMap.get(date) || { date, spend: 0, conversions: 0, conversionsValue: 0, clicks: 0, impressions: 0 };
        day.spend += spend;
        day.conversions += conversions;
        day.conversionsValue += conversionsValue;
        day.clicks += clicks;
        day.impressions += impressions;
        dailyMap.set(date, day);
      }
    }

    const campaigns = [...campaignMap.values()];

    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const conversionsValue = campaigns.reduce((s, c) => s + c.conversionsValue, 0);

    return {
      platform: "google",
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
      daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getGoogleAdsMetrics error:", error.message);
    return unavailableMetrics("Google Ads API request failed", error.message);
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
  if (!isConfigured(connection)) return [];
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
