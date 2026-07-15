import { timingSafeEqual } from "node:crypto";
import { generateWeeklyAnalyticsReport } from "../../../../lib/posthog-weekly-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request) {
  const expected = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const report = await generateWeeklyAnalyticsReport();
    const publishUrl = new URL("/api/admin/analytics-reports", request.url);
    const publishResponse = await fetch(publishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ANALYTICS_REPORTS_API_KEY?.trim() || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
      cache: "no-store",
    });
    const published = await publishResponse.json().catch(() => ({}));
    if (!publishResponse.ok || published.ok !== true) {
      throw new Error(`Report publisher rejected the report (${publishResponse.status}).`);
    }
    return Response.json({ ok: true, reportId: published.report?.id, period: report.periodLabel });
  } catch (error) {
    console.error("Weekly analytics report failed:", error);
    return Response.json({ ok: false, error: error.message || "Weekly analytics report failed." }, { status: 500 });
  }
}
