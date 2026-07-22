import { optimizeBudget, getDailyPerformanceSummary, identifyUnderperformers } from "./budget-optimizer.js";
import { generateAdVariations } from "./ai-ad-generator.js";
import { sendOptimizationReport, sendBudgetAlert } from "./send-report.js";
import { saveAdMetrics, saveOptimizationRun } from "./supabase-client.js";
import { loadLiveAdsMetrics } from "./ads-metrics-service.js";

const DEFAULT_BUDGET = 500;

export async function runAdsOptimizationWorkflow({ dryRun = false, dependencies = {}, now = new Date() } = {}) {
  const getSummary = dependencies.getDailyPerformanceSummary || getDailyPerformanceSummary;
  const optimize = dependencies.optimizeBudget || optimizeBudget;
  const generateVariations = dependencies.generateAdVariations || generateAdVariations;
  const findUnderperformers = dependencies.identifyUnderperformers || identifyUnderperformers;
  const sendBudgetWarning = dependencies.sendBudgetAlert || sendBudgetAlert;
  const sendReport = dependencies.sendOptimizationReport || sendOptimizationReport;
  const persistRun = dependencies.saveOptimizationRun || saveOptimizationRun;
  const persistMetrics = dependencies.saveAdMetrics || saveAdMetrics;
  const loadMetrics = dependencies.loadLiveAdsMetrics || loadLiveAdsMetrics;

  const startedAt = Date.now();
  const dailySummary = await getSummary();
  const liveSnapshot = await loadMetrics(1);
  const optimizationResult = await optimize();
  const adVariations = await generateVariations("tire-sales", "local-searchers");
  const underperformers = await findUnderperformers(0.05);
  const budgetUsagePercent = (Number(dailySummary.totalSpend) / DEFAULT_BUDGET) * 100;
  const timestamp = now.toISOString();
  const reportData = {
    previousBudget: optimizationResult.previousBudget,
    recommendedBudget: optimizationResult.newBudget,
    aiRecommendations: optimizationResult.aiRecommendations,
    metrics: optimizationResult.metrics,
    adVariations,
    underperformers,
    budgetUsage: budgetUsagePercent,
    timestamp,
    liveSnapshot,
  };

  let budgetAlertSent = false;
  let reportSent = false;
  let saved = false;
  let metricsSaved = 0;
  if (!dryRun) {
    if (budgetUsagePercent > 90) {
      await sendBudgetWarning(DEFAULT_BUDGET, dailySummary.totalSpend);
      budgetAlertSent = true;
    }
    await sendReport(reportData);
    reportSent = true;
    const metricWrites = await Promise.allSettled(
      Object.entries(liveSnapshot.byPlatform || {})
        .filter(([, metrics]) => metrics.connected && metrics.available)
        .map(([platform, metrics]) => persistMetrics({
          platform,
          date: timestamp,
          spend: metrics.spend,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          conversionValue: metrics.conversionValue,
          impressions: metrics.impressions,
          ctr: metrics.ctr,
          avgCpc: metrics.avgCpc,
          roas: metrics.roas,
        }))
    );
    metricsSaved = metricWrites.filter((result) => result.status === "fulfilled" && result.value).length;
    try {
      await persistRun({
        date: timestamp,
        type: "daily_recommendation",
        budget_allocation: optimizationResult.newBudget,
        metrics: optimizationResult.metrics,
        recommendations: optimizationResult.aiRecommendations,
        ad_variations: adVariations,
        underperformers,
      });
      saved = true;
    } catch (error) {
      console.warn("Could not save optimization run:", error.message);
    }
  }

  return {
    success: true,
    dryRun,
    message: dryRun ? "AI optimization analysis completed" : "Daily optimization report completed",
    data: {
      budgetOptimization: optimizationResult,
      adVariationsGenerated: adVariations.length,
      underperformersFound: underperformers,
      budgetUsagePercent: budgetUsagePercent.toFixed(1),
      budgetAlertSent,
      reportSent,
      saved,
      metricsSaved,
      appliedBudgetChanges: false,
      duration: `${Date.now() - startedAt}ms`,
      timestamp,
    },
  };
}
