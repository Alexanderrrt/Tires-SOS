import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAdsDays, summarizeAdsMetrics } from "../lib/ads-metrics-summary.js";
import { loadLiveAdsMetrics } from "../lib/ads-metrics-service.js";
import { runAdsOptimizationWorkflow } from "../lib/ads-optimization-workflow.js";

test("normalizes dashboard ranges to safe supported values", () => {
  assert.equal(normalizeAdsDays("14"), 14);
  assert.equal(normalizeAdsDays("-5"), 1);
  assert.equal(normalizeAdsDays("500"), 90);
  assert.equal(normalizeAdsDays("invalid"), 7);
});

test("calculates real ROAS from conversion value and aggregates daily metrics", () => {
  const summary = summarizeAdsMetrics({
    google_ads: {
      connected: true,
      spend: 100,
      conversions: 4,
      conversionsValue: 350,
      clicks: 50,
      impressions: 1000,
      daily: [
        { date: "2026-07-19", spend: 40, conversions: 1, conversionsValue: 100, clicks: 20, impressions: 400 },
        { date: "2026-07-20", spend: 60, conversions: 3, conversionsValue: 250, clicks: 30, impressions: 600 },
      ],
    },
    meta_ads: { connected: true, spend: 50, conversions: 2, conversionsValue: 100, clicks: 25, impressions: 500, daily: [] },
  }, 7);

  assert.equal(summary.totalSpend, 150);
  assert.equal(summary.totalConversions, 6);
  assert.equal(summary.totalConversionValue, 450);
  assert.equal(summary.avgROAS, 3);
  assert.equal(summary.avgCTR, 5);
  assert.equal(summary.avgCPC, 2);
  assert.equal(summary.byPlatform.google_ads.roas, 3.5);
  assert.equal(summary.daily[1].roas, 4.17);
});

test("live metrics service never invents data for disconnected or failed platforms", async () => {
  const summary = await loadLiveAdsMetrics(7, {
    getAdConnections: async () => ({
      google_ads: { connected: true, fields: {} },
      meta_ads: { connected: false, fields: {} },
      yelp: { connected: false, fields: {} },
    }),
    loaders: {
      google_ads: async () => { throw new Error("provider rejected credentials"); },
      meta_ads: async () => ({ spend: 999 }),
      yelp: async () => ({ spend: 999 }),
    },
  });

  assert.equal(summary.totalSpend, 0);
  assert.equal(summary.byPlatform.google_ads.connected, true);
  assert.match(summary.byPlatform.google_ads.error, /provider rejected/);
  assert.equal(summary.byPlatform.meta_ads.spend, 0);
  assert.equal(summary.byPlatform.yelp.spend, 0);
});

function workflowDependencies(calls) {
  return {
    getDailyPerformanceSummary: async () => ({ totalSpend: 475 }),
    loadLiveAdsMetrics: async () => ({
      byPlatform: {
        google_ads: { connected: true, available: true, spend: 10, clicks: 5, conversions: 2, conversionValue: 40, impressions: 100, ctr: 5, avgCpc: 2, roas: 4 },
        meta_ads: { connected: false, available: false },
        yelp: { connected: false, available: false },
      },
    }),
    optimizeBudget: async () => ({ previousBudget: { google: 100 }, newBudget: { google: 500, meta: 0, yelp: 0 }, aiRecommendations: { actions: ["Keep monitoring"] }, metrics: { google: { roas: 4 } } }),
    generateAdVariations: async () => [{ id: 1 }, { id: 2 }],
    identifyUnderperformers: async () => ({ google: [], meta: [] }),
    sendBudgetAlert: async () => { calls.budgetAlerts += 1; },
    sendOptimizationReport: async () => { calls.reports += 1; },
    saveAdMetrics: async () => { calls.metricWrites += 1; return { id: 1 }; },
    saveOptimizationRun: async () => { calls.runWrites += 1; return { id: 1 }; },
  };
}

test("manual AI analysis is a full dry run with no external writes", async () => {
  const calls = { budgetAlerts: 0, reports: 0, metricWrites: 0, runWrites: 0 };
  const result = await runAdsOptimizationWorkflow({ dryRun: true, dependencies: workflowDependencies(calls), now: new Date("2026-07-20T18:00:00Z") });
  assert.equal(result.success, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.data.adVariationsGenerated, 2);
  assert.equal(result.data.appliedBudgetChanges, false);
  assert.deepEqual(calls, { budgetAlerts: 0, reports: 0, metricWrites: 0, runWrites: 0 });
});

test("scheduled workflow sends reports and persists one live platform snapshot", async () => {
  const calls = { budgetAlerts: 0, reports: 0, metricWrites: 0, runWrites: 0 };
  const result = await runAdsOptimizationWorkflow({ dependencies: workflowDependencies(calls), now: new Date("2026-07-20T18:00:00Z") });
  assert.equal(result.success, true);
  assert.equal(result.data.reportSent, true);
  assert.equal(result.data.saved, true);
  assert.equal(result.data.metricsSaved, 1);
  assert.deepEqual(calls, { budgetAlerts: 1, reports: 1, metricWrites: 1, runWrites: 1 });
});
