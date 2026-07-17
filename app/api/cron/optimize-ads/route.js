import { timingSafeEqual } from "node:crypto";
import { optimizeBudget, getDailyPerformanceSummary, identifyUnderperformers } from "@/lib/budget-optimizer";
import { generateAdVariations } from "@/lib/ai-ad-generator";
import { sendOptimizationReport, sendDailySummary, sendBudgetAlert, sendErrorAlert } from "@/lib/send-report";
import { saveOptimizationRun } from "@/lib/supabase-client";

// Fail closed: reject when CRON_SECRET is unset, and compare in constant time.
function authorized(request) {
  const expected = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Daily ad optimization cron job
 * Runs every day at 9 AM PST
 *
 * Process:
 * 1. Fetch metrics from all ad platforms
 * 2. Analyze ROAS and optimize budget allocation
 * 3. Generate new ad variations for testing
 * 4. Identify underperformers to pause
 * 5. Send report to owner
 */
export async function GET(request) {
  if (!authorized(request)) {
    console.warn("Unauthorized cron request");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  try {
    console.log("Starting daily ad optimization...");
    const startTime = Date.now();

    // Step 1: Get current performance
    const dailySummary = await getDailyPerformanceSummary();
    console.log("Daily summary fetched:", dailySummary);

    // Step 2: Optimize budget allocation
    const optimizationResult = await optimizeBudget();
    console.log("Budget optimization complete:", optimizationResult);

    // Step 3: Generate new ad variations
    const adVariations = await generateAdVariations(
      "tire-sales",
      "local-searchers"
    );
    console.log("Ad variations generated:", adVariations.length);

    // Step 4: Identify underperformers
    const underperformers = await identifyUnderperformers(0.05);
    console.log("Underperformers identified:", underperformers);

    // Step 5: Check budget status
    const budgetUsagePercent =
      (dailySummary.totalSpend / 500) * 100;
    if (budgetUsagePercent > 90) {
      console.warn("Budget approaching limit, sending alert");
      await sendBudgetAlert(500, dailySummary.totalSpend);
    }

    // Step 6: Send comprehensive report
    const reportData = {
      previousBudget: optimizationResult.previousBudget,
      newBudget: optimizationResult.newBudget,
      aiRecommendations: optimizationResult.aiRecommendations,
      metrics: optimizationResult.metrics,
      adVariations,
      underperformers,
      budgetUsage: budgetUsagePercent,
      timestamp: new Date().toISOString(),
    };

    await sendOptimizationReport(reportData);
    console.log("Optimization report sent");

    // Step 7: Save optimization run to database
    try {
      await saveOptimizationRun({
        date: new Date().toISOString(),
        budget_allocation: optimizationResult.newBudget,
        metrics: optimizationResult.metrics,
        recommendations: optimizationResult.aiRecommendations,
        ad_variations: adVariations,
        underperformers: underperformers,
      });
      console.log("Optimization run saved to database");
    } catch (dbError) {
      console.warn("Could not save to database:", dbError.message);
      // Don't fail the entire cron if DB save fails
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Daily optimization completed",
        data: {
          budgetOptimization: optimizationResult,
          adVariationsGenerated: adVariations.length,
          underperformersFound: underperformers,
          budgetUsagePercent: budgetUsagePercent.toFixed(1),
          reportSent: true,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in ad optimization cron:", error);

    // Send error alert
    await sendErrorAlert("❌ Ad Optimization Error", error);

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
 * Manual trigger endpoint (for testing)
 * POST /api/cron/optimize-ads?manual=true with CRON_SECRET
 */
export async function POST(request) {
  if (!authorized(request)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  // Trigger the same process as GET
  return GET(request);
}
