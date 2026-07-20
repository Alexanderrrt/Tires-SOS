import { isAdminAuthorized } from "../../../../lib/admin-auth";
import { setChatSettings, chatStoreConfigured } from "../../../../lib/chat-settings-store";
import { sanitizeChatSettings } from "../../../../lib/chat-settings-validate";

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
    clean = sanitizeChatSettings(payload);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 422 });
  }

  try {
    const res = await setChatSettings(clean);
    return Response.json({ ok: true, persisted: res.persisted, storeConfigured: chatStoreConfigured() });
  } catch (e) {
    return Response.json({ error: "Save failed: " + e.message }, { status: 500 });
  }
}
