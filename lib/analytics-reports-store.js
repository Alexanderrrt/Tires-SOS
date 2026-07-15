import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

let client;

function supabase() {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase analytics report storage is not configured.");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function listAnalyticsReports(limit = 24) {
  const { data, error } = await supabase()
    .from("analytics_reports")
    .select("id,title,period_label,period_start,period_end,summary,html,created_at")
    .order("period_end", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 24, 1), 52));
  if (error) throw error;
  return data || [];
}

export async function saveAnalyticsReport(report) {
  const database = supabase();
  const row = {
    id: randomUUID(),
    title: report.title,
    period_label: report.periodLabel,
    period_start: report.periodStart,
    period_end: report.periodEnd,
    summary: report.summary,
    html: report.html,
  };
  const { data: existing, error: lookupError } = await database
    .from("analytics_reports")
    .select("id")
    .eq("period_start", report.periodStart)
    .eq("period_end", report.periodEnd)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;

  let query;
  if (existing?.id) {
    const changes = { ...row };
    delete changes.id;
    query = database.from("analytics_reports").update(changes).eq("id", existing.id);
  } else {
    query = database.from("analytics_reports").insert(row);
  }
  const { data, error } = await query
    .select("id,title,period_label,period_start,period_end,summary,html,created_at")
    .single();
  if (error) throw error;
  return data;
}
