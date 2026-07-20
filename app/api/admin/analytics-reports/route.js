import { timingSafeEqual } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { isAdminUserAllowed } from "../../../../lib/admin-auth";
import { listAnalyticsReports, saveAnalyticsReport } from "../../../../lib/analytics-reports-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function matchesSecret(provided, expected) {
  if (!provided || !expected) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateReport(body) {
  if (!body || typeof body !== "object") return "Invalid JSON body.";
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 180) return "Invalid title.";
  if (typeof body.periodLabel !== "string" || !body.periodLabel.trim() || body.periodLabel.length > 120) return "Invalid period label.";
  if (!validDate(body.periodStart) || !validDate(body.periodEnd) || body.periodEnd < body.periodStart) return "Invalid report period.";
  if (!body.summary || typeof body.summary !== "object" || Array.isArray(body.summary)) return "Invalid summary.";
  if (typeof body.html !== "string" || !body.html.trim() || body.html.length > 500000) return "Invalid report HTML.";
  const required = ["pageviews", "uniqueVisitors", "contactClicks", "quotesSent", "appointments"];
  if (required.some((key) => !Number.isFinite(Number(body.summary[key])) || Number(body.summary[key]) < 0)) return "Invalid summary metrics.";
  return "";
}

export async function GET() {
  const { userId } = await auth();
  if (!isAdminUserAllowed(userId)) return Response.json({ error: "Forbidden." }, { status: 403 });
  try {
    const reports = await listAnalyticsReports();
    return Response.json({ ok: true, reports }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analytics report list failed:", error);
    return Response.json({ error: "Could not load analytics reports." }, { status: 500 });
  }
}

export async function POST(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!matchesSecret(token, process.env.ANALYTICS_REPORTS_API_KEY?.trim())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const validationError = validateReport(body);
  if (validationError) return Response.json({ error: validationError }, { status: 400 });
  try {
    const report = await saveAnalyticsReport({
      ...body,
      title: body.title.trim(),
      periodLabel: body.periodLabel.trim(),
      summary: Object.fromEntries(Object.entries(body.summary).map(([key, value]) => [key, Number(value) || 0])),
    });
    return Response.json({ ok: true, report }, { status: 201 });
  } catch (error) {
    console.error("Analytics report publish failed:", error);
    return Response.json({ error: "Could not publish analytics report." }, { status: 500 });
  }
}
