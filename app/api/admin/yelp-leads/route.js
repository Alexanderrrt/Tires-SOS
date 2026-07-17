import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import { listRecentYelpLeads } from "../../../../lib/yelp-leads-store";
import { gmailConfigured } from "../../../../lib/gmail-client";
import { runYelpLeadResponder } from "../../../../lib/yelp-lead-responder";

async function requireAuth() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function GET() {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const leads = await listRecentYelpLeads();
    return Response.json(
      { leads, gmailConfigured: gmailConfigured() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return Response.json({ error: error.message || "Could not load Yelp leads." }, { status: 500 });
  }
}

/** Manually runs the same check the cron job runs every 5 minutes. */
export async function POST() {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runYelpLeadResponder();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error.message || "Manual check failed." }, { status: 500 });
  }
}
