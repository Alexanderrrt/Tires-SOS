import { detectAnomalies } from "../../../../lib/advanced-ai-engine";
import { requireAdminUser } from "../../../../lib/require-admin-user";

export async function POST(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const metrics = body?.metrics;
  if (!metrics || typeof metrics.totalSpend !== "number") return Response.json({ error: "Missing metrics payload." }, { status: 400 });

  const budget = Number(body?.adBudget) || 500;
  const alerts = [];
  const seen = new Set();
  const addAlert = (alert) => {
    if (seen.has(alert.id)) return;
    seen.add(alert.id);
    alerts.push(alert);
  };

  const periodDays = Math.max(1, Number(metrics.days) || 7);
  const projectedMonthlySpend = (Number(metrics.totalSpend) || 0) / periodDays * 30.4;
  const usage = budget > 0 ? (projectedMonthlySpend / budget) * 100 : 0;
  if (usage >= 115) {
    addAlert({ id: "budget-over", severity: "CRITICAL", icon: "💸", title: "Projected over monthly budget", detail: `The current ${periodDays}-day pace projects about $${projectedMonthlySpend.toFixed(0)} against the $${budget} monthly budget.` });
  } else if (usage >= 100) {
    addAlert({ id: "budget-near", severity: "WARNING", icon: "💰", title: "Projected slightly over budget", detail: `The current pace projects ${usage.toFixed(0)}% of the $${budget} monthly budget.` });
  }

  if (metrics.trend === "declining" && Number(metrics.totalConversionValue) > 0 && Number(metrics.totalSpend) >= 50) {
    addAlert({ id: "roas-declining", severity: "WARNING", icon: "📉", title: "ROAS is declining", detail: "Conversion-value return on ad spend dropped over the latest three days compared with the previous three." });
  }

  for (const [platform, data] of Object.entries(metrics.byPlatform || {})) {
    const label = platform === "google_ads" ? "Google Ads" : platform === "meta_ads" ? "Meta Ads" : "Yelp";
    if (data.connected && data.error) {
      addAlert({ id: `${platform}-unavailable`, severity: "WARNING", icon: "🔌", title: `${label} metrics unavailable`, detail: data.error });
      continue;
    }
    const spend = Number(data.spend) || 0;
    const roas = Number(data.roas) || 0;
    const conversions = Number(data.conversions) || 0;
    if (spend >= 50 && conversions === 0 && roas < 0.05) {
      addAlert({ id: `${platform}-no-conversions`, severity: "WARNING", icon: "🚨", title: `${label} has spend without conversions`, detail: `$${spend.toFixed(0)} spent with no recorded conversions. Check tracking before changing the campaign.` });
    }
  }

  const ctr = Number(metrics.avgCTR) || 0;
  if (metrics.totalImpressions > 2500 && ctr < 1) {
    addAlert({ id: "low-ctr", severity: "WARNING", icon: "👀", title: "Low click-through rate", detail: `CTR is ${ctr}% across ${metrics.totalImpressions.toLocaleString()} impressions — ad creative may be fatigued.` });
  }

  try {
    const daily = Array.isArray(metrics.daily) ? metrics.daily : [];
    if (daily.length >= 4) {
      const latest = daily[daily.length - 1];
      const history = daily.slice(0, -1);
      const average = (rows, select) => rows.reduce((sum, row) => sum + select(row), 0) / rows.length;
      const cpc = (row) => row.clicks > 0 ? row.spend / row.clicks : 0;
      const averageImpressions = average(history, (row) => Number(row.impressions) || 0);
      const hasUsefulSample = Number(latest.impressions) >= Math.max(250, averageImpressions * 0.5) && Number(latest.spend) >= 5;
      if (hasUsefulSample) {
        const result = await detectAnomalies(
          { avgCpc: cpc(latest), conversions: latest.conversions, ctr: latest.impressions > 0 ? latest.clicks / latest.impressions * 100 : 0 },
          { avgCpc: average(history, cpc), conversions: average(history, (row) => row.conversions), ctr: average(history, (row) => row.impressions > 0 ? row.clicks / row.impressions * 100 : 0) }
        );
        for (const anomaly of result?.anomalies || []) {
          if (anomaly.severity !== "CRITICAL") continue;
          const title = anomaly.type === "CTR_DROP" ? "Significant CTR drop" : anomaly.type === "CPC_SPIKE" ? "Significant CPC increase" : "Conversion anomaly";
          addAlert({ id: `anomaly-${anomaly.type}`, severity: "WARNING", icon: "🤖", title, detail: anomaly.action ? `${anomaly.cause || ""}. ${anomaly.action}`.trim() : anomaly.cause || "Performance changed significantly." });
        }
      }
    }
  } catch {
    // Rule-based alerts remain available when anomaly analysis cannot run.
  }

  const priority = { CRITICAL: 0, WARNING: 1 };
  alerts.sort((a, b) => (priority[a.severity] ?? 2) - (priority[b.severity] ?? 2));
  return Response.json({ alerts: alerts.slice(0, 3), checkedAt: new Date().toISOString() });
}
