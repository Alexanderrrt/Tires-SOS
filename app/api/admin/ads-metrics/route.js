import { requireAdminUser } from "../../../../lib/require-admin-user";
import { loadLiveAdsMetrics } from "../../../../lib/ads-metrics-service";
import { normalizeAdsDays } from "../../../../lib/ads-metrics-summary";

/**
 * Live ad performance for the connected Tires SOS accounts.
 * GET /api/admin/ads-metrics?days=7
 */
export async function GET(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const days = normalizeAdsDays(searchParams.get("days"));
    const summary = await loadLiveAdsMetrics(days);
    return Response.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching ads metrics:", error);
    return Response.json(
      { error: error?.message || "Could not load ads metrics." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
