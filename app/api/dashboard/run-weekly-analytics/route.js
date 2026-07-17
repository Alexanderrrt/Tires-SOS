import { runWeeklyAnalyticsReport } from "../../../../lib/weekly-analytics-runner";
import { requireDashboardUser } from "../../../../lib/require-dashboard-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request) {
  const denied = await requireDashboardUser();
  if (denied) return denied;
  try {
    const result = await runWeeklyAnalyticsReport(new URL(request.url).origin);
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
