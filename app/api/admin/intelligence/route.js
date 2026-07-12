import { cookies } from "next/headers";
import { getOptimizationHistory } from "@/lib/supabase-client";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Get latest intelligence data for dashboard
 * POST /api/admin/intelligence
 */
export async function GET(request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

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
    const insights = latestRun.metrics || {};
    const data = {
      timestamp: latestRun.run_date || latestRun.created_at,
      anomalies: insights.anomalies || {},
      predictions: insights.roasForecasts || {},
      bidAdjustments: insights.bidAdjustments || {},
      crossPlatformInsights: insights.crossPlatformInsights || {},
      keywordOpportunities: insights.keywordOpportunities || {},
      conversionPaths: insights.conversionPaths || {},
      sentimentInsights: insights.sentimentInsights || {},
      spendForecast: insights.spendForecast || {},
      recommendations: latestRun.recommendations || {},
      metrics: insights,
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
