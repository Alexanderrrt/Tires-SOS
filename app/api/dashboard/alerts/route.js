import { detectAnomalies } from "../../../../lib/advanced-ai-engine";

// Computes alerts from the metrics summary the dashboard already holds.
// Rule-based checks plus the AI engine's anomaly detection over the
// daily series. Clerk middleware protects this route.

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const m = body?.metrics;
  if (!m || typeof m.totalSpend !== "number") {
    return Response.json({ error: "Missing metrics payload." }, { status: 400 });
  }

  const budget = Number(body?.adBudget) || 500;
  const alerts = [];

  // --- Rule-based checks ---
  const usage = budget > 0 ? (m.totalSpend / budget) * 100 : 0;
  if (usage >= 100) {
    alerts.push({ severity: "CRITICAL", icon: "💸", title: "Budget exhausted", detail: `Spend has hit $${m.totalSpend.toFixed(0)} of the $${budget} monthly budget. Pause campaigns or raise the budget.` });
  } else if (usage >= 90) {
    alerts.push({ severity: "WARNING", icon: "💰", title: "Budget almost used up", detail: `${usage.toFixed(0)}% of the $${budget} monthly ad budget is spent.` });
  }

  if (m.trend === "declining") {
    alerts.push({ severity: "WARNING", icon: "📉", title: "ROAS is declining", detail: "Return on ad spend has dropped over the last 3 days vs the 3 before. Check the daily report for the cause." });
  }

  for (const [platform, data] of Object.entries(m.byPlatform || {})) {
    const label = platform === "google_ads" ? "Google Ads" : platform === "meta_ads" ? "Meta Ads" : "Yelp";
    const spend = Number(data.spend) || 0;
    const roas = Number(data.roas) || 0;
    if (spend > 20 && roas < 0.05) {
      alerts.push({ severity: "CRITICAL", icon: "🚨", title: `${label} is burning money`, detail: `$${spend.toFixed(0)} spent at ${roas}x ROAS. Consider pausing its worst campaigns.` });
    }
  }

  const ctr = Number(m.avgCTR) || 0;
  if (m.totalImpressions > 1000 && ctr < 1) {
    alerts.push({ severity: "WARNING", icon: "👀", title: "Low click-through rate", detail: `CTR is ${ctr}% across ${m.totalImpressions.toLocaleString()} impressions — ad creative may be fatigued.` });
  }

  // --- AI anomaly detection over the daily series ---
  try {
    const daily = Array.isArray(m.daily) ? m.daily : [];
    if (daily.length >= 4) {
      const latest = daily[daily.length - 1];
      const history = daily.slice(0, -1);
      const avg = (arr, fn) => arr.reduce((s, d) => s + fn(d), 0) / arr.length;
      const cpcOf = (d) => (d.clicks > 0 ? d.spend / d.clicks : 0);
      const current = { avgCpc: cpcOf(latest), conversions: latest.conversions, ctr: 1 };
      const historical = { avgCpc: avg(history, cpcOf), conversions: avg(history, (d) => d.conversions), ctr: 1 };
      const anomalies = await detectAnomalies(current, historical);
      for (const a of anomalies || []) {
        alerts.push({
          severity: a.severity || "WARNING",
          icon: "🤖",
          title: a.type || "Anomaly detected",
          detail: a.description || a.suggestion || JSON.stringify(a),
        });
      }
    }
  } catch {
    // anomaly detection is best-effort; rule-based alerts still returned
  }

  return Response.json({ alerts, checkedAt: new Date().toISOString() });
}
