import { isAdminAuthorized } from "../../../../lib/admin-auth";
import { setPricing, storeConfigured } from "../../../../lib/pricing-store";
import { sanitizePricing } from "../../../../lib/pricing-validate";

async function requireAuth() {
  return isAdminAuthorized();
}

export async function PUT(request) {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad JSON." }, { status: 400 });
  }

  let clean;
  try {
    clean = sanitizePricing(payload);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 422 });
  }

  try {
    const res = await setPricing(clean);
    return Response.json({ ok: true, persisted: res.persisted, storeConfigured: storeConfigured() });
  } catch (e) {
    return Response.json({ error: "Save failed: " + e.message }, { status: 500 });
  }
}
