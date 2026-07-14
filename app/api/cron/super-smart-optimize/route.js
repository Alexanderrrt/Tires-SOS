import Anthropic from "@anthropic-ai/sdk";
import { optimizeBudget, getDailyPerformanceSummary, identifyUnderperformers } from "@/lib/budget-optimizer";
import { generateAdVariations } from "@/lib/ai-ad-generator";
import {
  multiArmedBandit,
  predictROAS,
  detectAnomalies,
  smartBidAdjustment,
  crossPlatformLearning,
  analyzeConversionPath,
  discoverKeywordOpportunities,
  predictiveSpendForecast,
  analyzeCompetitorSentiment,
} from "@/lib/advanced-ai-engine";
import { sendOptimizationReport } from "@/lib/send-report";
import { saveOptimizationRun, getMetricsForDateRange } from "@/lib/supabase-client";
import { getAdConnections } from "@/lib/ad-connections-store";
import { getDeviceBreakdown as getGoogleDeviceBreakdown, getHourBreakdown, getTopKeywords } from "@/lib/google-ads-api";
import { getDeviceBreakdown as getMetaDeviceBreakdown } from "@/lib/meta-ads-api";

const anthropicClient = new Anthropic();

/**
 * SUPER SMART DAILY OPTIMIZATION
 * Runs advanced AI analysis on all ad metrics
 *
 * Process:
 * 1. Fetch all historical and current metrics
 * 2. Detect anomalies & alert on issues
 * 3. Predict future ROAS trends
 * 4. Multi-armed bandit optimization
 * 5. Smart bid adjustments
 * 6. Cross-platform learning
 * 7. Keyword discovery
 * 8. Conversion path analysis
 * 9. Competitor sentiment analysis
 * 10. Spend forecasting
 * 11. Generate intelligent recommendations
 * 12. Send comprehensive intelligence report
 */
export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  try {
    console.log("🤖 Starting SUPER SMART optimization...");
    const startTime = Date.now();

    // ============================================
    // 1. GATHER INTELLIGENCE
    // ============================================
    console.log("📊 Step 1: Gathering metrics...");

    const connections = await getAdConnections();
    const dailySummary = await getDailyPerformanceSummary();
    const last30Days = await getMetricsForDateRange(
      null,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    // ============================================
    // 2. DETECT ANOMALIES
    // ============================================
    console.log("🚨 Step 2: Detecting anomalies...");

    const historicalAvg = {
      avgCpc: last30Days.reduce((sum, m) => sum + (m.avg_cpc || 0), 0) / (last30Days.length || 1),
      ctr: last30Days.reduce((sum, m) => sum + (m.ctr || 0), 0) / (last30Days.length || 1),
      conversions: last30Days.reduce((sum, m) => sum + (m.conversions || 0), 0) / (last30Days.length || 1),
    };

    const anomalies = await detectAnomalies(
      {
        avgCpc: dailySummary.google.avgCpc,
        ctr: dailySummary.google.ctr,
        conversions: dailySummary.google.conversions,
      },
      historicalAvg
    );

    if (anomalies.requiresAction) {
      console.warn("⚠️ CRITICAL ANOMALIES DETECTED:", anomalies);
    }

    // ============================================
    // 3. PREDICT ROAS TRENDS
    // ============================================
    console.log("🔮 Step 3: Predicting ROAS trends...");

    const roasForecasts = {};
    try {
      roasForecasts.google = await predictROAS({
        platform: "google",
        data: last30Days.filter((m) => m.platform === "google_ads"),
      });
      roasForecasts.meta = await predictROAS({
        platform: "meta",
        data: last30Days.filter((m) => m.platform === "meta_ads"),
      });
    } catch (e) {
      console.warn("Could not generate ROAS forecast:", e.message);
    }

    // ============================================
    // 4. MULTI-ARMED BANDIT OPTIMIZATION
    // ============================================
    console.log("🎰 Step 4: Running multi-armed bandit...");

    const adVariations = await generateAdVariations("tire-sales", "local-searchers");
    const banditResults = await multiArmedBandit(adVariations, []);

    // ============================================
    // 5. SMART BID ADJUSTMENTS
    // ============================================
    console.log("💰 Step 5: Calculating smart bid adjustments...");

    // Real segment data from Google (hour + device) and Meta (device).
    // There is no reliable cross-platform "audience" breakdown API without
    // a configured remarketing/audience list, so that segment is omitted
    // rather than filled with invented numbers.
    const [googleHourly, googleDevice, metaDevice] = await Promise.all([
      getHourBreakdown(connections.google_ads),
      getGoogleDeviceBreakdown(connections.google_ads),
      getMetaDeviceBreakdown(connections.meta_ads),
    ]);

    const byTime = googleHourly.map((h) => ({
      segment: `${h.hour}:00-${(h.hour + 1) % 24}:00`,
      clicks: h.clicks,
      conversions: h.conversions,
      cost: h.cost,
    }));

    const byDevice = [...googleDevice, ...metaDevice].reduce((acc, d) => {
      const key = String(d.device).toLowerCase();
      const bucket = (acc[key] ||= { device: key, clicks: 0, conversions: 0, cost: 0 });
      bucket.clicks += d.clicks;
      bucket.conversions += d.conversions;
      bucket.cost += d.cost;
      return acc;
    }, {});

    const bidAdjustments = byTime.length || Object.keys(byDevice).length
      ? await smartBidAdjustment({
          byTime,
          byDevice: Object.values(byDevice),
          byAudience: [],
          baseBid: 2.5,
        })
      : { adjustments: { by_time: [], by_device: [], by_audience: [] }, note: "No connected ad platform has segment data yet." };

    // ============================================
    // 6. CROSS-PLATFORM LEARNING
    // ============================================
    console.log("🌐 Step 6: Analyzing cross-platform insights...");

    const crossPlatformInsights = await crossPlatformLearning(
      dailySummary
    );

    // ============================================
    // 7. KEYWORD DISCOVERY
    // ============================================
    console.log("🔍 Step 7: Discovering keyword opportunities...");

    // Real keywords currently bid on (Google Ads keyword_view). There's no
    // wired third-party search-volume/CPC-estimate API, so the "search
    // data" side stays a small illustrative sample the AI can compare
    // against — flagged in the prompt as an estimate, not live data.
    const realKeywords = await getTopKeywords(connections.google_ads, 10);
    const keywordOpportunities = await discoverKeywordOpportunities(
      realKeywords.length ? realKeywords.map((k) => k.keyword).filter(Boolean) : ["tire repair", "new tires", "wheel alignment"],
      [
        { keyword: "tire replacement near me", volume: 1200, cpc: 2.1, note: "illustrative estimate, not from a live keyword-volume API" },
        { keyword: "flat tire repair", volume: 800, cpc: 1.8, note: "illustrative estimate, not from a live keyword-volume API" },
        { keyword: "tire sale san jose", volume: 600, cpc: 3.2, note: "illustrative estimate, not from a live keyword-volume API" },
      ]
    );

    // ============================================
    // 8. CONVERSION PATH ANALYSIS
    // ============================================
    console.log("📍 Step 8: Analyzing conversion paths...");

    // Real click/conversion counts from the platforms that expose them.
    // Yelp has no clicks/conversions API (see lib/yelp-api.js), so it's
    // omitted here rather than filled with an invented number.
    const conversionPaths = await analyzeConversionPath(
      {
        google_search: dailySummary.google.clicks ?? 0,
        meta_feed: dailySummary.meta.clicks ?? 0,
      },
      {
        google_search: dailySummary.google.conversions ?? 0,
        meta_feed: dailySummary.meta.conversions ?? 0,
      }
    );

    // ============================================
    // 9. SENTIMENT ANALYSIS
    // ============================================
    console.log("💬 Step 9: Analyzing competitor sentiment...");

    const sentimentInsights = await analyzeCompetitorSentiment(
      [
        "Long wait times",
        "Poor customer service",
        "Overpriced",
        "Limited hours",
      ],
      [
        "Fast service",
        "Professional staff",
        "Best prices in area",
        "Bilingual service",
      ]
    );

    // ============================================
    // 10. SPEND FORECASTING
    // ============================================
    console.log("💵 Step 10: Forecasting monthly spend...");

    const dailySpends = last30Days.slice(-14).map((m) => m.spend || 0);
    const spendForecast = predictiveSpendForecast(
      dailySpends,
      15
    );

    // ============================================
    // 11. GENERATE INTELLIGENT RECOMMENDATIONS
    // ============================================
    console.log("🧠 Step 11: Synthesizing recommendations...");

    const allInsights = {
      anomalies,
      roasForecasts,
      banditResults,
      bidAdjustments,
      crossPlatformInsights,
      keywordOpportunities,
      conversionPaths,
      sentimentInsights,
      spendForecast,
    };

    const intelligentRecommendations = await synthesizeRecommendations(allInsights);

    // ============================================
    // 12. SEND COMPREHENSIVE REPORT
    // ============================================
    console.log("📧 Step 12: Sending report...");

    const reportData = {
      type: "super_smart",
      dailySummary,
      anomalies,
      predictions: roasForecasts,
      banditOptimization: banditResults,
      bidAdjustments,
      crossPlatformInsights,
      keywordOpportunities,
      conversionPaths,
      sentimentInsights,
      spendForecast,
      recommendations: intelligentRecommendations,
      timestamp: new Date().toISOString(),
    };

    await sendOptimizationReport(reportData);

    // ============================================
    // 13. SAVE TO DATABASE
    // ============================================
    console.log("💾 Step 13: Saving to database...");

    try {
      await saveOptimizationRun({
        date: new Date().toISOString(),
        type: "super_smart",
        budget_allocation: dailySummary,
        metrics: allInsights,
        recommendations: intelligentRecommendations,
      });
    } catch (dbError) {
      console.warn("Database save failed:", dbError.message);
    }

    const duration = Date.now() - startTime;

    console.log("✅ SUPER SMART optimization complete!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Super smart optimization completed",
        analysis: {
          anomaliesFound: anomalies.anomalies.length,
          roasTrend: roasForecasts.google?.trend || "unknown",
          topRecommendations: intelligentRecommendations.topActions.slice(0, 3),
          anomaliesCritical: anomalies.requiresAction,
          keywordOpportunitiesFound: keywordOpportunities.opportunities?.length || 0,
          spendRiskLevel: spendForecast.riskLevel,
        },
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in super smart optimization:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500 }
    );
  }
}

/**
 * Synthesize all insights into actionable recommendations
 */
async function synthesizeRecommendations(allInsights) {
  try {
    const message = await anthropicClient.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a master AI marketing strategist. Synthesize ALL this intelligence into a prioritized action plan:

Anomalies Detected:
${JSON.stringify(allInsights.anomalies, null, 2)}

ROAS Predictions:
${JSON.stringify(allInsights.roasForecasts, null, 2)}

Bid Adjustment Recommendations:
${JSON.stringify(allInsights.bidAdjustments, null, 2)}

Cross-Platform Insights:
${JSON.stringify(allInsights.crossPlatformInsights, null, 2)}

Keyword Opportunities:
${JSON.stringify(allInsights.keywordOpportunities, null, 2)}

Conversion Paths:
${JSON.stringify(allInsights.conversionPaths, null, 2)}

Competitor Analysis:
${JSON.stringify(allInsights.sentimentInsights, null, 2)}

Budget Forecast:
${JSON.stringify(allInsights.spendForecast, null, 2)}

Create a strategic action plan with:
1. Top 5 immediate actions (next 24 hours)
2. Medium-term optimizations (next 7 days)
3. Strategic changes (next 30 days)
4. Risk mitigation measures
5. Expected ROI improvement

Return as JSON:
{
  "topActions": ["action1", "action2", ...],
  "mediumTermPlan": ["plan1", "plan2", ...],
  "strategicChanges": ["change1", "change2", ...],
  "riskMitigation": ["risk1", "risk2", ...],
  "expectedImprovement": "X% ROI increase",
  "confidence": "high" | "medium" | "low",
  "estimatedTimeToImplement": "X hours"
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        topActions: ["Review all anomalies", "Update bids", "Test new keywords"],
        mediumTermPlan: [],
        strategicChanges: [],
        riskMitigation: [],
        expectedImprovement: "15-25%",
        confidence: "medium",
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error synthesizing recommendations:", error);
    return {
      topActions: ["Manual review required"],
      confidence: "low",
    };
  }
}
