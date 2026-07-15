import { generateWeeklyAnalyticsReport } from "./posthog-weekly-report";

export async function runWeeklyAnalyticsReport(publishOrigin) {
  const report = await generateWeeklyAnalyticsReport();
  const publishResponse = await fetch(new URL("/api/admin/analytics-reports", publishOrigin), {
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
  return { report, published: published.report };
}
