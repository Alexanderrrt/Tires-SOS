import { timingSafeEqual } from "node:crypto";
import { runWeeklyAnalyticsReport } from "../../../../lib/weekly-analytics-runner";

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
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const publishOrigin = productionHost
      ? `https://${productionHost}`
      : process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tires-sos.vercel.app";
    const result = await runWeeklyAnalyticsReport(publishOrigin);
    return Response.json({ ok: true, reportId: result.published?.id, period: result.report.periodLabel });
  } catch (error) {
    console.error("Weekly analytics report failed:", error);
    return Response.json({ ok: false, error: error.message || "Weekly analytics report failed." }, { status: 500 });
  }
}
