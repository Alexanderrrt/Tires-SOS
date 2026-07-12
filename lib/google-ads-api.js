import { GoogleAdsApi, enums } from "google-ads-api";

let googleAdsClient = null;

/**
 * Initialize Google Ads API client
 */
export function initializeGoogleAds() {
  if (googleAdsClient) return googleAdsClient;

  googleAdsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return googleAdsClient;
}

/**
 * Get performance metrics for all Google Ads campaigns
 * Returns: spend, clicks, conversions, cost per conversion, ROAS
 */
export async function getGoogleAdsMetrics(customerId) {
  try {
    const client = initializeGoogleAds();

    const response = await client.report({
      entity: "campaign",
      body: {
        query: `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion,
            segments.date
          FROM campaign
          WHERE
            segments.date >= YYYY_MM_DD_TODAY_-_30
            AND campaign.status = ENABLED
          ORDER BY metrics.cost_micros DESC
        `,
      },
    });

    // Aggregate metrics
    let totalSpend = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalImpressions = 0;
    const campaigns = [];

    response.forEach((row) => {
      totalSpend += row.metrics.cost_micros / 1_000_000;
      totalClicks += row.metrics.clicks;
      totalConversions += row.metrics.conversions;
      totalImpressions += row.metrics.impressions;

      campaigns.push({
        id: row.campaign.id,
        name: row.campaign.name,
        status: row.campaign.status,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        conversions: row.metrics.conversions,
        spend: row.metrics.cost_micros / 1_000_000,
        ctr: row.metrics.ctr,
        avgCpc: row.metrics.average_cpc / 1_000_000,
        costPerConversion: row.metrics.cost_per_conversion / 1_000_000,
      });
    });

    const roas = totalSpend > 0 ? totalConversions / totalSpend : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      platform: "google_ads",
      spend: parseFloat(totalSpend.toFixed(2)),
      clicks: totalClicks,
      conversions: totalConversions,
      impressions: totalImpressions,
      ctr: parseFloat(ctr.toFixed(2)),
      avgCpc: parseFloat(avgCpc.toFixed(2)),
      roas: parseFloat(roas.toFixed(2)),
      campaigns,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching Google Ads metrics:", error);
    throw error;
  }
}

/**
 * Update campaign budget
 */
export async function updateCampaignBudget(campaignId, newBudgetMicros) {
  try {
    const client = initializeGoogleAds();

    const response = await client.campaigns.update({
      campaign: {
        resource_name: `customers/${process.env.GOOGLE_CUSTOMER_ID}/campaigns/${campaignId}`,
        budget: {
          amount_micros: newBudgetMicros,
        },
      },
      update_mask: {
        paths: ["budget.amount_micros"],
      },
    });

    return response;
  } catch (error) {
    console.error("Error updating campaign budget:", error);
    throw error;
  }
}

/**
 * Create new ad group ad
 */
export async function createAd(adGroupId, headlineText, descriptionText) {
  try {
    const client = initializeGoogleAds();

    const adGroupAdResource = {
      ad_group: `customers/${process.env.GOOGLE_CUSTOMER_ID}/adGroups/${adGroupId}`,
      ad: {
        responsive_search_ad: {
          headlines: [
            { text: headlineText, pinned_field: enums.ServedAssetFieldType.HEADLINE_1 },
          ],
          descriptions: [
            { text: descriptionText },
          ],
        },
      },
      status: enums.AdGroupAdStatus.ENABLED,
    };

    const response = await client.adGroupAds.create({
      customer_id: process.env.GOOGLE_CUSTOMER_ID,
      ad_group_ad: adGroupAdResource,
    });

    return response;
  } catch (error) {
    console.error("Error creating ad:", error);
    throw error;
  }
}

/**
 * Pause low-performing keywords
 */
export async function pauseKeyword(keywordResourceName) {
  try {
    const client = initializeGoogleAds();

    const response = await client.adGroupCriteria.update({
      ad_group_criterion: {
        resource_name: keywordResourceName,
        status: enums.AdGroupCriterionStatus.PAUSED,
      },
      update_mask: {
        paths: ["status"],
      },
    });

    return response;
  } catch (error) {
    console.error("Error pausing keyword:", error);
    throw error;
  }
}

/**
 * Get top performing keywords
 */
export async function getTopKeywords(limit = 10) {
  try {
    const client = initializeGoogleAds();

    const response = await client.report({
      entity: "ad_group_criterion",
      body: {
        query: `
          SELECT
            ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion
          FROM ad_group_criterion
          WHERE
            segments.date >= YYYY_MM_DD_TODAY_-_30
            AND ad_group_criterion.type = KEYWORD
            AND metrics.conversions > 0
          ORDER BY metrics.cost_per_conversion ASC
          LIMIT ${limit}
        `,
      },
    });

    return response.map((row) => ({
      keyword: row.ad_group_criterion.keyword.text,
      conversions: row.metrics.conversions,
      spend: row.metrics.cost_micros / 1_000_000,
      costPerConversion: row.metrics.cost_per_conversion / 1_000_000,
      ctr: row.metrics.ctr,
    }));
  } catch (error) {
    console.error("Error fetching top keywords:", error);
    throw error;
  }
}
