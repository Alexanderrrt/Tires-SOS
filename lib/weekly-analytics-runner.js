import { generateWeeklyAnalyticsReport } from "./posthog-weekly-report";

export async function runWeeklyAnalyticsReport(publishOrigin, range) {
  const report = await generateWeeklyAnalyticsReport(range);
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const publishResponse = await fetch(new URL("/api/admin/analytics-reports", publishOrigin), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ANALYTICS_REPORTS_API_KEY?.trim() || ""}`,
      "Content-Type": "application/json",
      // Preview deployments have Vercel Authentication enabled, which would
      // otherwise block this server's own self-call before it reaches our
      // route handler.
      ...(bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}),
    },
    body: JSON.stringify(report),
    cache: "no-store",
  });
  const published = await publishResponse.json().catch(() => ({}));
  if (!publishResponse.ok || published.ok !== true) {
    throw new Error(`Report publisher rejected the report (${publishResponse.status}).`);
  }
  return { report, published: published.report };
}
