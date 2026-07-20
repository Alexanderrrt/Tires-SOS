import { runWeeklyAnalyticsReport } from "../../../../lib/weekly-analytics-runner";
import { requireAdminUser } from "../../../../lib/require-admin-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  let range;
  if (body?.periodStart || body?.periodEnd) {
    if (!validDate(body.periodStart) || !validDate(body.periodEnd) || body.periodEnd < body.periodStart) {
      return Response.json({ error: "Invalid custom date range." }, { status: 400 });
    }
    range = { periodStart: body.periodStart, periodEnd: body.periodEnd };
  }
  try {
    const result = await runWeeklyAnalyticsReport(new URL(request.url).origin, range);
    return Response.json({
      ok: true,
      reportId: result.published?.id,
      period: result.report.periodLabel,
    });
  } catch (error) {
    console.error("Manual weekly analytics report failed:", error);
    return Response.json(
      { ok: false, error: error.message || "Manual weekly analytics report failed." },
      { status: 500 },
    );
  }
}
