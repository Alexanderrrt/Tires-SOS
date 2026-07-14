/**
 * Yelp integration, backed by the `yelp` connection in
 * lib/ad-connections-store.js.
 *
 * IMPORTANT: Yelp does not publish a third-party API for managing Yelp Ads
 * budgets or pulling ad spend/campaign metrics (that self-serve dashboard is
 * only accessible to the business owner in Yelp's own UI). This wrapper uses
 * the public Yelp Fusion API to pull real business signals (rating, review
 * count) as a proxy for organic performance, and treats spend/budget as a
 * manually-entered figure — there is no write API to actually move Yelp ad
 * budget, so `updateBudget` always returns a manual-action result.
 */

const FUSION_BASE_URL = "https://api.yelp.com/v3";

function mockMetrics(reason) {
  return {
    platform: "yelp",
    mocked: true,
    mockReason: reason,
    spend: 100,
    conversions: 12,
    conversionsValue: 12,
    clicks: 250,
    impressions: 5000,
    ctr: 5,
    avgCpc: 0.4,
    roas: 0.12,
    rating: null,
    reviewCount: null,
    lastUpdated: new Date().toISOString(),
  };
}

function fieldsFromConnection(connection) {
  const f = connection?.fields || {};
  return { businessId: f.business_id, apiKey: f.api_key };
}

function isConfigured(connection) {
  const { businessId, apiKey } = fieldsFromConnection(connection);
  return Boolean(connection?.connected && businessId && apiKey);
}

/**
 * manualSpend: the owner-entered monthly Yelp Ads spend (no API exposes this),
 * used to keep the ROAS math consistent with the other platforms.
 */
export async function getYelpMetrics(connection, manualSpend = 100) {
  if (!isConfigured(connection)) return mockMetrics("Yelp connection not configured");

  try {
    const { businessId, apiKey } = fieldsFromConnection(connection);
    const res = await fetch(`${FUSION_BASE_URL}/businesses/${encodeURIComponent(businessId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Yelp Fusion API failed: ${data?.error?.description || res.status}`);

    return {
      platform: "yelp",
      mocked: false,
      note: "Yelp has no public API for ad spend/conversions; spend is manually entered and rating/reviewCount come from the real Fusion API.",
      spend: manualSpend,
      conversions: null,
      conversionsValue: null,
      clicks: null,
      impressions: null,
      ctr: null,
      avgCpc: null,
      roas: null,
      rating: data.rating ?? null,
      reviewCount: data.review_count ?? null,
      url: data.url ?? null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("getYelpMetrics error:", error.message);
    return { ...mockMetrics(error.message), spend: manualSpend, error: error.message };
  }
}

export async function updateBudget(connection, targetBudget) {
  return {
    success: false,
    status: "manual",
    message: "Yelp does not expose a public API to change ad budgets — update this manually in the Yelp Ads dashboard.",
    targetBudget,
  };
}
