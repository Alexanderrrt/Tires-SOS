// Admin-triggered optimization run. Proxies to the cron endpoint with the
// server-side secret so the secret never reaches the browser.
import { requireAdminUser } from "../../../../lib/require-admin-user";

export async function POST(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const res = await fetch(`${origin}/api/cron/optimize-ads?dryRun=true`, {
      method: "GET",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
