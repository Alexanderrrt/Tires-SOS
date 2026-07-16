import { timingSafeEqual } from "node:crypto";
import { runYelpLeadResponder } from "../../../../lib/yelp-lead-responder";

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
    const result = await runYelpLeadResponder();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Yelp lead responder failed:", error);
    return Response.json({ ok: false, error: error.message || "Yelp lead responder failed." }, { status: 500 });
  }
}

/** Manual trigger for testing: POST with the same CRON_SECRET bearer token. */
export async function POST(request) {
  return GET(request);
}
