import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get real-time metrics for a client
 * GET /api/dashboard/clients/[clientId]/metrics?days=7
 */
export async function GET(request, { params }) {
  try {
    const { clientId } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days")) || 7;

    // Get metrics for last N days
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: metrics, error } = await supabase
      .from("daily_metrics")
      .select(
        `
        *,
        campaign:campaigns(campaign_name, platform)
      `
      )
      .eq("client_id", clientId)
      .gte("metric_date", startDate)
      .order("metric_date", { ascending: true });

    if (error) throw error;

    // Aggregate metrics
    const summary = {
      totalSpend: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalImpressions: 0,
      avgROAS: 0,
      avgCTR: 0,
      avgCPC: 0,
      byPlatform: {
        google_ads: {
          spend: 0,
          conversions: 0,
          clicks: 0,
          roas: 0,
        },
        meta_ads: {
          spend: 0,
          conversions: 0,
          clicks: 0,
          roas: 0,
        },
        yelp: {
          spend: 0,
          conversions: 0,
          clicks: 0,
          roas: 0,
        },
      },
      daily: [],
      trend: "stable", // improving, declining, stable
    };

    // Process metrics
    metrics.forEach((m) => {
      summary.totalSpend += m.spend || 0;
      summary.totalClicks += m.clicks || 0;
      summary.totalConversions += m.conversions || 0;
      summary.totalImpressions += m.impressions || 0;

      if (summary.byPlatform[m.platform]) {
        summary.byPlatform[m.platform].spend += m.spend || 0;
        summary.byPlatform[m.platform].conversions += m.conversions || 0;
        summary.byPlatform[m.platform].clicks += m.clicks || 0;
      }
    });

    // Calculate averages
    summary.avgROAS =
      summary.totalSpend > 0
        ? (summary.totalConversions / summary.totalSpend).toFixed(2)
        : 0;
    summary.avgCTR =
      summary.totalImpressions > 0
        ? ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2)
        : 0;
    summary.avgCPC =
      summary.totalClicks > 0
        ? (summary.totalSpend / summary.totalClicks).toFixed(2)
        : 0;

    // Calculate ROAS by platform
    Object.keys(summary.byPlatform).forEach((platform) => {
      const p = summary.byPlatform[platform];
      p.roas =
        p.spend > 0 ? (p.conversions / p.spend).toFixed(2) : 0;
    });

    // Group by day for charts
    const dailyMap = {};
    metrics.forEach((m) => {
      if (!dailyMap[m.metric_date]) {
        dailyMap[m.metric_date] = {
          date: m.metric_date,
          spend: 0,
          conversions: 0,
          clicks: 0,
          roas: 0,
        };
      }
      dailyMap[m.metric_date].spend += m.spend || 0;
      dailyMap[m.metric_date].conversions += m.conversions || 0;
      dailyMap[m.metric_date].clicks += m.clicks || 0;
    });

    summary.daily = Object.values(dailyMap);

    // Detect trend
    if (summary.daily.length > 3) {
      const recent = summary.daily.slice(-3);
      const older = summary.daily.slice(-6, -3);

      const recentAvgROAS = recent.reduce((sum, d) => sum + parseFloat(d.roas), 0) / recent.length;
      const olderAvgROAS = older.reduce((sum, d) => sum + parseFloat(d.roas), 0) / older.length;

      if (recentAvgROAS > olderAvgROAS * 1.1) {
        summary.trend = "improving";
      } else if (recentAvgROAS < olderAvgROAS * 0.9) {
        summary.trend = "declining";
      }
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
