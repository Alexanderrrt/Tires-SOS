import { isAdminAuthorized } from "../../../../lib/admin-auth";
import { getHaywardRevealed, launchStoreConfigured, setHaywardRevealed } from "../../../../lib/location-launch-store";

export async function GET() {
  if (!(await isAdminAuthorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  return Response.json({ revealed: await getHaywardRevealed(), storeConfigured: launchStoreConfigured() });
}

export async function PUT(request) {
  if (!(await isAdminAuthorized())) return Response.json({ error: "Unauthorized." }, { status: 401 });
  let payload;
  try { payload = await request.json(); } catch { return Response.json({ error: "Bad JSON." }, { status: 400 }); }
  try {
    const result = await setHaywardRevealed(payload?.revealed === true);
    return Response.json({ ok: true, ...result, storeConfigured: launchStoreConfigured() });
  } catch (error) { return Response.json({ error: `Save failed: ${error.message}` }, { status: 500 }); }
}
