import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;
const DEFAULT_CLIENT_ID = process.env.DASHBOARD_DEFAULT_CLIENT_ID || "00000000-0000-4000-8000-000000000001";
const DEFAULT_CLIENT_EMAIL = process.env.DASHBOARD_DEFAULT_CLIENT_EMAIL || "tiressosrescue@gmail.com";

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

async function resolveClientId(client, requestedId) {
  if (requestedId) return requestedId;
  const { data, error } = await client
    .from("dashboard_clients")
    .select("id")
    .eq("business_email", DEFAULT_CLIENT_EMAIL)
    .maybeSingle();
  if (!error && data?.id) return data.id;
  return DEFAULT_CLIENT_ID;
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
    const clientId = await resolveClientId(client, runData.clientId);
    const { data, error } = await client
      .from("optimization_runs")
      .insert([
        {
          client_id: clientId,
          run_date: runData.date,
          run_type: runData.type || "daily",
          budget_allocation: runData.budget_allocation,
          metrics: runData.metrics,
          recommendations: runData.recommendations,
          actions_taken: {
            adVariations: runData.ad_variations || [],
            underperformers: runData.underperformers || [],
          },
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
    const clientId = await resolveClientId(client);
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString();

    const { data, error } = await client
      .from("optimization_runs")
      .select("*")
      .eq("client_id", clientId)
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
    const clientId = await resolveClientId(client, metricsData.clientId);
    const { data, error } = await client
      .from("daily_metrics")
      .insert([
        {
          client_id: clientId,
          platform: metricsData.platform,
          metric_date: (metricsData.date || new Date().toISOString()).slice(0, 10),
          spend: metricsData.spend,
          clicks: metricsData.clicks,
          conversions: metricsData.conversions,
          impressions: metricsData.impressions,
          click_through_rate: metricsData.ctr,
          cost_per_click: metricsData.avgCpc,
          roas: metricsData.roas,
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
    const clientId = await resolveClientId(client);
    let query = client
      .from("daily_metrics")
      .select("*")
      .eq("client_id", clientId)
      .gte("metric_date", startDate.slice(0, 10))
      .lte("metric_date", endDate.slice(0, 10));

    if (platform) query = query.eq("platform", platform);

    const { data, error } = await query.order("metric_date", { ascending: true });

    if (error) throw error;
    return (data || []).map((metric) => ({
      ...metric,
      date: metric.metric_date,
      ctr: metric.click_through_rate,
      avg_cpc: metric.cost_per_click,
    }));
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
    const clientId = await resolveClientId(client, variationData.clientId);
    const { data, error } = await client
      .from("ad_variations")
      .insert([
        {
          client_id: clientId,
          platform: variationData.platform,
          headline_en: variationData.headlineEn,
          headline_es: variationData.headlineEs,
          description_en: variationData.descriptionEn,
          description_es: variationData.descriptionEs,
          variation_type: variationData.type,
          status: variationData.status || "draft",
          performance_score: variationData.performanceScore || null,
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
    const clientId = await resolveClientId(client);
    let query = client
      .from("ad_variations")
      .select("*")
      .eq("client_id", clientId)
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
    const clientId = await resolveClientId(client);
    const { data, error } = await client
      .from("ad_variations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", variationId)
      .eq("client_id", clientId)
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
    const clientId = await resolveClientId(client);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString();

    const { data, error } = await client
      .from("daily_metrics")
      .select("*")
      .eq("client_id", clientId)
      .gte("metric_date", sevenDaysAgo.slice(0, 10))
      .order("metric_date", { ascending: false });

    if (error) throw error;

    // Aggregate by platform
    const summary = {
      google: { spend: 0, conversions: 0, clicks: 0 },
      meta: { spend: 0, conversions: 0, clicks: 0 },
      yelp: { spend: 0, conversions: 0, clicks: 0 },
    };

    const platformKeys = { google_ads: "google", meta_ads: "meta", yelp: "yelp" };
    (data || []).forEach((metric) => {
      const key = platformKeys[metric.platform];
      if (key && summary[key]) {
        summary[key].spend += Number(metric.spend) || 0;
        summary[key].conversions += Number(metric.conversions) || 0;
        summary[key].clicks += Number(metric.clicks) || 0;
      }
    });

    return summary;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return null;
  }
}
