import { sendDailySummary } from "../../../../lib/send-report";
import { requireDashboardUser } from "../../../../lib/require-dashboard-user";

// Sends the daily performance summary email. Protected by Clerk
// middleware, with an in-handler re-check as defense-in-depth.

export async function POST(request) {
  const denied = await requireDashboardUser();
  if (denied) return denied;
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL_RECIPIENT) {
    return Response.json(
      { error: "Email is not configured (set RESEND_API_KEY and NOTIFY_EMAIL_RECIPIENT)." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const m = body?.metrics;
  if (!m || typeof m.totalSpend !== "number") {
    return Response.json({ error: "Missing metrics payload." }, { status: 400 });
  }

  const budget = Number(body?.adBudget) || 500;
  const google = m.byPlatform?.google_ads || {};
  const meta = m.byPlatform?.meta_ads || {};

  try {
    const result = await sendDailySummary({
      date: new Date().toLocaleDateString(),
      totalSpend: Number(m.totalSpend) || 0,
      totalConversions: Number(m.totalConversions) || 0,
      budgetRemaining: Math.max(0, budget - (Number(m.totalSpend) || 0)),
      google: {
        spend: Number(google.spend) || 0,
        conversions: Number(google.conversions) || 0,
        roas: Number(google.roas) || 0,
      },
      meta: {
        spend: Number(meta.spend) || 0,
        conversions: Number(meta.conversions) || 0,
        roas: Number(meta.roas) || 0,
      },
    });
    return Response.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
