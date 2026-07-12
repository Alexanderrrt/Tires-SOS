import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;

/**
 * Initialize Supabase client
 */
function stripBom(value) {
  return typeof value === "string" ? value.replace(/^﻿/, "").trim() : value;
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = stripBom(process.env.SUPABASE_URL);
  const key = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    console.warn(
      "Supabase not configured. Database features will be disabled."
    );
    return null;
  }

  supabaseClient = createClient(url, key);

  return supabaseClient;
}

/**
 * Save optimization run to database
 */
export async function saveOptimizationRun(runData) {
  const client = getSupabaseClient();
  if (!client) {
    console.warn("Supabase not available, skipping database save");
    return null;
  }

  try {
    const { data, error } = await client
      .from("ad_optimization_runs")
      .insert([
        {
          run_date: runData.date,
          budget_allocation: runData.budget_allocation,
          metrics: runData.metrics,
          recommendations: runData.recommendations,
          ad_variations: runData.ad_variations,
          underperformers: runData.underperformers,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error saving optimization run:", error);
    throw error;
  }
}

/**
 * Get recent optimization runs
 */
export async function getOptimizationHistory(days = 30) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString();

    const { data, error } = await client
      .from("ad_optimization_runs")
      .select("*")
      .gte("run_date", sinceDate)
      .order("run_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching optimization history:", error);
    return [];
  }
}

/**
 * Save ad performance metrics
 */
export async function saveAdMetrics(metricsData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("ad_performance_metrics")
      .insert([
        {
          platform: metricsData.platform,
          date: metricsData.date || new Date().toISOString(),
          spend: metricsData.spend,
          clicks: metricsData.clicks,
          conversions: metricsData.conversions,
          impressions: metricsData.impressions,
          ctr: metricsData.ctr,
          avg_cpc: metricsData.avgCpc,
          roas: metricsData.roas,
          metadata: metricsData.metadata || {},
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error saving ad metrics:", error);
    throw error;
  }
}

/**
 * Get metrics for a specific date range
 */
export async function getMetricsForDateRange(platform, startDate, endDate) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("ad_performance_metrics")
      .select("*")
      .eq("platform", platform)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return [];
  }
}

/**
 * Save tested ad variation
 */
export async function saveAdVariation(variationData) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("ad_variations")
      .insert([
        {
          platform: variationData.platform,
          headline_en: variationData.headlineEn,
          headline_es: variationData.headlineEs,
          description_en: variationData.descriptionEn,
          description_es: variationData.descriptionEs,
          variation_type: variationData.type,
          status: variationData.status || "draft",
          performance_data: variationData.performanceData || {},
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error saving ad variation:", error);
    throw error;
  }
}

/**
 * Get all active ad variations
 */
export async function getActiveVariations(platform = null) {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    let query = client
      .from("ad_variations")
      .select("*")
      .eq("status", "active");

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching active variations:", error);
    return [];
  }
}

/**
 * Update variation status
 */
export async function updateVariationStatus(variationId, status) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("ad_variations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", variationId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error updating variation status:", error);
    throw error;
  }
}

/**
 * Get dashboard summary (last 7 days)
 */
export async function getDashboardSummary() {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString();

    const { data, error } = await client
      .from("ad_performance_metrics")
      .select("*")
      .gte("date", sevenDaysAgo)
      .order("date", { ascending: false });

    if (error) throw error;

    // Aggregate by platform
    const summary = {
      google: { spend: 0, conversions: 0, clicks: 0 },
      meta: { spend: 0, conversions: 0, clicks: 0 },
      yelp: { spend: 0, conversions: 0, clicks: 0 },
    };

    (data || []).forEach((metric) => {
      if (summary[metric.platform]) {
        summary[metric.platform].spend += metric.spend || 0;
        summary[metric.platform].conversions += metric.conversions || 0;
        summary[metric.platform].clicks += metric.clicks || 0;
      }
    });

    return summary;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return null;
  }
}
