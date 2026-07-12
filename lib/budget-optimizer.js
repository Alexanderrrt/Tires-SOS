import { getGoogleAdsMetrics, updateCampaignBudget as updateGoogleBudget } from "./google-ads-api.js";
import { getMetaAdsMetrics, updateCampaignBudget as updateMetaBudget } from "./meta-ads-api.js";
import { analyzeAdPerformance } from "./ai-ad-generator.js";

const TOTAL_MONTHLY_BUDGET = 500; // dollars
const YELP_BUDGET_PERCENTAGE = 0.2; // 20% fixed allocation

/**
 * Analyze all platforms and optimize budget allocation
 * Returns new budget allocation based on ROAS
 */
export async function optimizeBudget() {
  try {
    console.log("Starting budget optimization...");

    // Get metrics from all platforms
    const googleMetrics = await getGoogleAdsMetrics(process.env.GOOGLE_CUSTOMER_ID);
    const metaMetrics = await getMetaAdsMetrics(process.env.META_AD_ACCOUNT_ID);

    // Yelp is manual for now (no API integration yet)
    const yelpMetrics = {
      platform: "yelp",
      spend: 100,
      conversions: 12,
      clicks: 250,
      impressions: 5000,
      ctr: 5,
      avgCpc: 0.4,
      roas: 0.12,
      lastUpdated: new Date().toISOString(),
    };

    // Calculate allocation based on ROAS
    const totalROAS = googleMetrics.roas + metaMetrics.roas + yelpMetrics.roas;

    if (totalROAS === 0) {
      console.warn("No conversions yet, using equal distribution");
      return getEqualDistribution();
    }

    // Weighted allocation based on ROAS
    const googleAllocation = Math.round((googleMetrics.roas / totalROAS) * TOTAL_MONTHLY_BUDGET * 100) / 100;
    const metaAllocation = Math.round((metaMetrics.roas / totalROAS) * TOTAL_MONTHLY_BUDGET * 100) / 100;
    const yelpAllocation = TOTAL_MONTHLY_BUDGET - googleAllocation - metaAllocation;

    const newBudget = {
      google: googleAllocation,
      meta: metaAllocation,
      yelp: Math.max(50, yelpAllocation), // Minimum $50 for Yelp
      total: TOTAL_MONTHLY_BUDGET,
      reasoning: `Allocation based on ROAS: Google ${googleMetrics.roas.toFixed(2)}x, Meta ${metaMetrics.roas.toFixed(2)}x, Yelp ${yelpMetrics.roas.toFixed(2)}x`,
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

    const results = {
      google: null,
      meta: null,
      yelp: null,
    };

    // Update Google Ads campaigns
    if (budgetAllocation.google > 0) {
      // Get first active campaign (simplified)
      const campaigns = []; // In real implementation, fetch from API
      if (campaigns.length > 0) {
        const budgetMicros = budgetAllocation.google * 1_000_000;
        results.google = await updateGoogleBudget(campaigns[0].id, budgetMicros);
      }
    }

    // Update Meta campaigns
    if (budgetAllocation.meta > 0) {
      const budgetCents = Math.round(budgetAllocation.meta * 100);
      // Get first active campaign (simplified)
      const campaigns = []; // In real implementation, fetch from API
      if (campaigns.length > 0) {
        results.meta = await updateMetaBudget(campaigns[0].id, budgetCents);
      }
    }

    // Yelp would be manual update or via Yelp API if available
    results.yelp = {
      status: "manual",
      message: "Yelp budget should be updated manually or via Yelp API",
      targetBudget: budgetAllocation.yelp,
    };

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
    const googleMetrics = await getGoogleAdsMetrics(process.env.GOOGLE_CUSTOMER_ID);
    const metaMetrics = await getMetaAdsMetrics(process.env.META_AD_ACCOUNT_ID);

    const summary = {
      date: new Date().toLocaleDateString(),
      google: {
        spend: googleMetrics.spend,
        conversions: googleMetrics.conversions,
        roas: googleMetrics.roas,
        topCampaigns: googleMetrics.campaigns.slice(0, 3),
      },
      meta: {
        spend: metaMetrics.spend,
        conversions: metaMetrics.conversions,
        roas: metaMetrics.roas,
        topCampaigns: metaMetrics.campaigns.slice(0, 3),
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
    const googleMetrics = await getGoogleAdsMetrics(process.env.GOOGLE_CUSTOMER_ID);
    const metaMetrics = await getMetaAdsMetrics(process.env.META_AD_ACCOUNT_ID);

    const underperformers = {
      google: googleMetrics.campaigns.filter((c) => c.roas && c.roas < minROAS),
      meta: metaMetrics.campaigns.filter((c) => c.roas && c.roas < minROAS),
    };

    return underperformers;
  } catch (error) {
    console.error("Error identifying underperformers:", error);
    throw error;
  }
}
