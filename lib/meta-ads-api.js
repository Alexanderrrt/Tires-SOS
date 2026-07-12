import { FacebookAdsApi, FacebookRequestError } from "facebook-nodejs-business-sdk";

/**
 * Initialize Meta Ads API
 */
export function initializeMeta() {
  FacebookAdsApi.init(process.env.META_ACCESS_TOKEN);
  FacebookAdsApi.setDefaultApiVersion("v19.0");
  return FacebookAdsApi;
}

/**
 * Get performance metrics for all Meta ad campaigns
 */
export async function getMetaAdsMetrics(adAccountId) {
  try {
    initializeMeta();

    const AdAccount = require("facebook-nodejs-business-sdk").AdAccount;
    const Fields = require("facebook-nodejs-business-sdk").Fields.Campaign;
    const Params = require("facebook-nodejs-business-sdk").Params.Campaign;

    const account = new AdAccount(adAccountId);

    // Get campaigns
    const campaigns = await account.getCampaigns(
      [
        Fields.id,
        Fields.name,
        Fields.status,
        Fields.daily_budget,
        Fields.lifetime_budget,
      ],
      {
        effective_status: ["ACTIVE", "PAUSED"],
        limit: 100,
      }
    );

    let totalSpend = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalImpressions = 0;
    const campaignsData = [];

    // Get insights for each campaign
    for (const campaign of campaigns) {
      const insights = await campaign.getInsights(
        [
          "spend",
          "clicks",
          "impressions",
          "actions",
          "ctr",
          "cpc",
          "cost_per_action_type",
        ],
        {
          date_preset: "last_30d",
          action_breakdowns: "action_type",
        }
      );

      const insightData = insights[0] || {};
      const spend = parseFloat(insightData.spend || 0);
      const clicks = parseInt(insightData.clicks || 0);
      const impressions = parseInt(insightData.impressions || 0);
      const ctr = insightData.ctr ? parseFloat(insightData.ctr) : 0;
      const cpc = insightData.cpc ? parseFloat(insightData.cpc) : 0;

      // Parse conversions from actions array
      let conversions = 0;
      if (insightData.actions && Array.isArray(insightData.actions)) {
        conversions = insightData.actions
          .filter((a) => a.action_type === "omni_purchase" || a.action_type === "purchase")
          .reduce((sum, a) => sum + parseInt(a.value), 0);
      }

      totalSpend += spend;
      totalClicks += clicks;
      totalConversions += conversions;
      totalImpressions += impressions;

      campaignsData.push({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        spend,
        clicks,
        conversions,
        impressions,
        ctr,
        cpc,
      });
    }

    const roas = totalSpend > 0 ? totalConversions / totalSpend : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      platform: "meta_ads",
      spend: parseFloat(totalSpend.toFixed(2)),
      clicks: totalClicks,
      conversions: totalConversions,
      impressions: totalImpressions,
      ctr: parseFloat(ctr.toFixed(2)),
      avgCpc: parseFloat(avgCpc.toFixed(2)),
      roas: parseFloat(roas.toFixed(2)),
      campaigns: campaignsData,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Meta Ads metrics:", error);
    throw error;
  }
}

/**
 * Update campaign budget
 */
export async function updateCampaignBudget(campaignId, newBudgetCents) {
  try {
    initializeMeta();

    const Campaign = require("facebook-nodejs-business-sdk").Campaign;
    const campaign = new Campaign(campaignId);

    await campaign.update({
      daily_budget: newBudgetCents, // in cents
    });

    return { success: true, campaignId, newBudget: newBudgetCents / 100 };
  } catch (error) {
    console.error("Error updating Meta campaign budget:", error);
    throw error;
  }
}

/**
 * Create new ad creative
 */
export async function createCreative(adAccountId, creativeData) {
  try {
    initializeMeta();

    const AdCreative = require("facebook-nodejs-business-sdk").AdCreative;
    const AdAccount = require("facebook-nodejs-business-sdk").AdAccount;

    const account = new AdAccount(adAccountId);

    const creative = new AdCreative(null, { account_id: adAccountId });

    const response = await creative.create({
      object_story_spec: {
        page_id: process.env.META_PAGE_ID,
        link_data: {
          message: creativeData.message,
          link: creativeData.link,
          caption: creativeData.caption,
          description: creativeData.description,
          image_hash: creativeData.imageHash, // Pre-uploaded image hash
        },
      },
      name: creativeData.name,
    });

    return response;
  } catch (error) {
    console.error("Error creating Meta creative:", error);
    throw error;
  }
}

/**
 * Pause low-performing ad
 */
export async function pauseAd(adId) {
  try {
    initializeMeta();

    const Ad = require("facebook-nodejs-business-sdk").Ad;
    const ad = new Ad(adId);

    await ad.update({
      status: "PAUSED",
    });

    return { success: true, adId };
  } catch (error) {
    console.error("Error pausing Meta ad:", error);
    throw error;
  }
}

/**
 * Get top performing ads
 */
export async function getTopAds(adAccountId, limit = 10) {
  try {
    initializeMeta();

    const AdAccount = require("facebook-nodejs-business-sdk").AdAccount;
    const account = new AdAccount(adAccountId);

    const ads = await account.getAds(
      ["id", "name", "status", "created_time"],
      {
        effective_status: ["ACTIVE"],
        limit: 100,
      }
    );

    const adsWithInsights = [];

    for (const ad of ads.slice(0, limit)) {
      const insights = await ad.getInsights(
        ["spend", "clicks", "impressions", "actions", "ctr", "cpc"],
        {
          date_preset: "last_30d",
          action_breakdowns: "action_type",
        }
      );

      const insightData = insights[0] || {};
      adsWithInsights.push({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        spend: parseFloat(insightData.spend || 0),
        clicks: parseInt(insightData.clicks || 0),
        ctr: parseFloat(insightData.ctr || 0),
        cpc: parseFloat(insightData.cpc || 0),
      });
    }

    return adsWithInsights.sort((a, b) => b.spend - a.spend);
  } catch (error) {
    console.error("Error fetching Meta ads:", error);
    throw error;
  }
}
