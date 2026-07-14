import { getGoogleAdsMetrics, updateCampaignBudget as updateGoogleBudget } from "./google-ads-api.js";
import { getMetaAdsMetrics, updateCampaignBudget as updateMetaBudget } from "./meta-ads-api.js";
import { getYelpMetrics, updateBudget as updateYelpBudget } from "./yelp-api.js";
import { getAdConnections } from "./ad-connections-store.js";
import { analyzeAdPerformance } from "./ai-ad-generator.js";

const TOTAL_MONTHLY_BUDGET = 500; // dollars

async function fetchAllMetrics() {
  const connections = await getAdConnections();
  const [googleMetrics, metaMetrics, yelpMetrics] = await Promise.all([
    getGoogleAdsMetrics(connections.google_ads),
    getMetaAdsMetrics(connections.meta_ads),
    getYelpMetrics(connections.yelp),
  ]);
  return { connections, googleMetrics, metaMetrics, yelpMetrics };
}

/**
 * Analyze all platforms and optimize budget allocation
 * Returns new budget allocation based on ROAS
 */
export async function optimizeBudget() {
  try {
    console.log("Starting budget optimization...");

    const { googleMetrics, metaMetrics, yelpMetrics } = await fetchAllMetrics();

    // Calculate allocation based on ROAS
    const totalROAS = (googleMetrics.roas || 0) + (metaMetrics.roas || 0) + (yelpMetrics.roas || 0);

    if (totalROAS === 0) {
      console.warn("No conversions yet, using equal distribution");
      return getEqualDistribution();
    }

    // Weighted allocation based on ROAS
    const googleAllocation = Math.round(((googleMetrics.roas || 0) / totalROAS) * TOTAL_MONTHLY_BUDGET * 100) / 100;
    const metaAllocation = Math.round(((metaMetrics.roas || 0) / totalROAS) * TOTAL_MONTHLY_BUDGET * 100) / 100;
    const yelpAllocation = TOTAL_MONTHLY_BUDGET - googleAllocation - metaAllocation;

    const newBudget = {
      google: googleAllocation,
      meta: metaAllocation,
      yelp: Math.max(50, yelpAllocation), // Minimum $50 for Yelp
      total: TOTAL_MONTHLY_BUDGET,
      reasoning: `Allocation based on ROAS: Google ${(googleMetrics.roas || 0).toFixed(2)}x, Meta ${(metaMetrics.roas || 0).toFixed(2)}x, Yelp ${(yelpMetrics.roas || 0).toFixed(2)}x`,
    };

    // Get AI recommendations
    const aiRecommendations = await analyzeAdPerformance({
      google: googleMetrics,
      meta: metaMetrics,
      yelp: yelpMetrics,
    });

    console.log("Budget optimization complete:", newBudget);

    return {
      previousBudget: {
        google: googleMetrics.spend,
        meta: metaMetrics.spend,
        yelp: yelpMetrics.spend,
      },
      newBudget,
      aiRecommendations,
      metrics: {
        google: googleMetrics,
        meta: metaMetrics,
        yelp: yelpMetrics,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error optimizing budget:", error);
    throw error;
  }
}

/**
 * Apply budget changes to ad platforms
 */
export async function applyBudgetChanges(budgetAllocation) {
  try {
    console.log("Applying budget changes...");

    const connections = await getAdConnections();
    const [googleMetrics, metaMetrics] = await Promise.all([
      getGoogleAdsMetrics(connections.google_ads),
      getMetaAdsMetrics(connections.meta_ads),
    ]);

    const results = {
      google: null,
      meta: null,
      yelp: null,
    };

    // Update the top-spending Google campaign's budget
    if (budgetAllocation.google > 0) {
      const campaign = googleMetrics.campaigns?.[0];
      if (campaign?.id) {
        const budgetMicros = budgetAllocation.google * 1_000_000;
        results.google = await updateGoogleBudget(connections.google_ads, campaign.id, budgetMicros);
      } else {
        results.google = { success: false, error: googleMetrics.mocked ? "Google Ads not connected" : "No active Google campaign found" };
      }
    }

    // Update the top-spending Meta campaign's budget
    if (budgetAllocation.meta > 0) {
      const campaign = metaMetrics.campaigns?.[0];
      if (campaign?.id) {
        const budgetCents = Math.round(budgetAllocation.meta * 100);
        results.meta = await updateMetaBudget(connections.meta_ads, campaign.id, budgetCents);
      } else {
        results.meta = { success: false, error: metaMetrics.mocked ? "Meta Ads not connected" : "No active Meta campaign found" };
      }
    }

    // Yelp has no public write API — always manual
    results.yelp = await updateYelpBudget(connections.yelp, budgetAllocation.yelp);

    console.log("Budget changes applied:", results);
    return results;
  } catch (error) {
    console.error("Error applying budget changes:", error);
    throw error;
  }
}

/**
 * Get equal distribution (fallback)
 */
function getEqualDistribution() {
  const perPlatform = Math.round((TOTAL_MONTHLY_BUDGET / 3) * 100) / 100;
  return {
    google: perPlatform,
    meta: perPlatform,
    yelp: TOTAL_MONTHLY_BUDGET - perPlatform * 2,
    total: TOTAL_MONTHLY_BUDGET,
    reasoning: "No conversion data yet, using equal distribution",
  };
}

/**
 * Get daily performance summary
 */
export async function getDailyPerformanceSummary() {
  try {
    const { googleMetrics, metaMetrics } = await fetchAllMetrics();

    const summary = {
      date: new Date().toLocaleDateString(),
      google: {
        spend: googleMetrics.spend,
        conversions: googleMetrics.conversions,
        clicks: googleMetrics.clicks,
        avgCpc: googleMetrics.avgCpc,
        ctr: googleMetrics.ctr,
        roas: googleMetrics.roas,
        topCampaigns: (googleMetrics.campaigns || []).slice(0, 3),
      },
      meta: {
        spend: metaMetrics.spend,
        conversions: metaMetrics.conversions,
        clicks: metaMetrics.clicks,
        avgCpc: metaMetrics.avgCpc,
        ctr: metaMetrics.ctr,
        roas: metaMetrics.roas,
        topCampaigns: (metaMetrics.campaigns || []).slice(0, 3),
      },
      totalSpend: googleMetrics.spend + metaMetrics.spend,
      totalConversions: googleMetrics.conversions + metaMetrics.conversions,
      budgetRemaining: TOTAL_MONTHLY_BUDGET - (googleMetrics.spend + metaMetrics.spend),
    };

    return summary;
  } catch (error) {
    console.error("Error getting daily performance summary:", error);
    throw error;
  }
}

/**
 * Identify underperforming campaigns to pause
 */
export async function identifyUnderperformers(minROAS = 0.05) {
  try {
    const { googleMetrics, metaMetrics } = await fetchAllMetrics();

    const underperformers = {
      google: (googleMetrics.campaigns || []).filter((c) => c.roas != null && c.roas < minROAS),
      meta: (metaMetrics.campaigns || []).filter((c) => c.roas != null && c.roas < minROAS),
    };

    return underperformers;
  } catch (error) {
    console.error("Error identifying underperformers:", error);
    throw error;
  }
}
