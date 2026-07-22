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

    const { connections, googleMetrics, metaMetrics, yelpMetrics } = await fetchAllMetrics();
    const platforms = [
      { key: "google", connection: connections.google_ads, metrics: googleMetrics },
      { key: "meta", connection: connections.meta_ads, metrics: metaMetrics },
      { key: "yelp", connection: connections.yelp, metrics: yelpMetrics },
    ];
    const eligible = platforms.filter((platform) => platform.connection?.connected && platform.metrics?.available !== false);
    if (eligible.length === 0) {
      return {
        previousBudget: { google: 0, meta: 0, yelp: 0 },
        newBudget: { google: 0, meta: 0, yelp: 0, total: 0, reasoning: "No connected platform returned usable live metrics; no reallocation was recommended." },
        aiRecommendations: { actions: ["Fix the connected platform error before changing any ad budget."], confidence: "low" },
        metrics: { google: googleMetrics, meta: metaMetrics, yelp: yelpMetrics },
        timestamp: new Date().toISOString(),
      };
    }

    const totalROAS = eligible.reduce((sum, platform) => sum + (Number(platform.metrics.roas) || 0), 0);
    const allocations = { google: 0, meta: 0, yelp: 0 };
    if (totalROAS > 0) {
      let allocated = 0;
      eligible.forEach((platform, index) => {
        const amount = index === eligible.length - 1
          ? TOTAL_MONTHLY_BUDGET - allocated
          : Math.round(((Number(platform.metrics.roas) || 0) / totalROAS) * TOTAL_MONTHLY_BUDGET * 100) / 100;
        allocations[platform.key] = amount;
        allocated += amount;
      });
    } else {
      const equalShare = Math.floor((TOTAL_MONTHLY_BUDGET * 100) / eligible.length) / 100;
      let allocated = 0;
      eligible.forEach((platform, index) => {
        const amount = index === eligible.length - 1 ? TOTAL_MONTHLY_BUDGET - allocated : equalShare;
        allocations[platform.key] = amount;
        allocated += amount;
      });
    }

    const newBudget = {
      ...allocations,
      total: TOTAL_MONTHLY_BUDGET,
      reasoning: totalROAS > 0
        ? `Recommendation weighted by live conversion-value ROAS across ${eligible.map((platform) => platform.key).join(", ")}.`
        : `No conversion value is available yet; split evenly across connected platforms: ${eligible.map((platform) => platform.key).join(", ")}.`,
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
      if (campaign?.budgetResourceName) {
        const dailyBudgetMicros = (budgetAllocation.google / 30.4) * 1_000_000;
        results.google = await updateGoogleBudget(connections.google_ads, campaign.budgetResourceName, dailyBudgetMicros);
      } else {
        results.google = { success: false, error: googleMetrics.mocked ? "Google Ads not connected" : "No active Google campaign found" };
      }
    }

    // Update the top-spending Meta campaign's budget
    if (budgetAllocation.meta > 0) {
      const campaign = metaMetrics.campaigns?.[0];
      if (campaign?.id) {
        const dailyBudgetCents = Math.round((budgetAllocation.meta / 30.4) * 100);
        results.meta = await updateMetaBudget(connections.meta_ads, campaign.id, dailyBudgetCents);
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
