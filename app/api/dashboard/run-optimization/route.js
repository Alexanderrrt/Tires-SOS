// Dashboard-triggered optimization run. Clerk middleware protects this
// route; it proxies to the cron endpoint with the server-side secret so
// the secret never reaches the browser.

export async function POST(request) {
  if (!process.env.CRON_SECRET) {
    return Response.json(
      { error: "CRON_SECRET is not configured on the server." },
      { status: 503 }
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const res = await fetch(`${origin}/api/cron/optimize-ads`, {
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
