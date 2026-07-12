import { getOptimizationHistory } from "@/lib/supabase-client";

/**
 * Get latest intelligence data for dashboard
 * POST /api/admin/intelligence
 */
export async function GET(request) {
  try {
    // Get latest optimization run
    const history = await getOptimizationHistory(1);
    const latestRun = history[0];

    if (!latestRun) {
      return new Response(
        JSON.stringify({
          message: "No optimization data yet",
          timestamp: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }

    // Parse the stored data
    const data = {
      timestamp: latestRun.run_date || latestRun.created_at,
      anomalies: latestRun.recommendations?.anomalies || {},
      predictions: latestRun.recommendations?.predictions || {},
      bidAdjustments: latestRun.recommendations?.bidAdjustments || {},
      crossPlatformInsights: latestRun.recommendations?.crossPlatformInsights || {},
      keywordOpportunities: latestRun.recommendations?.keywordOpportunities || {},
      conversionPaths: latestRun.recommendations?.conversionPaths || {},
      sentimentInsights: latestRun.recommendations?.sentimentInsights || {},
      spendForecast: latestRun.recommendations?.spendForecast || {},
      recommendations: latestRun.recommendations?.recommendations || {},
      metrics: latestRun.metrics || {},
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching intelligence data:", error);

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500 }
    );
  }
}
