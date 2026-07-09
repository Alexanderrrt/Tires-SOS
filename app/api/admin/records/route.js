import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import {
  getChatRecords,
  recordsStoreConfigured,
  updateRecordStatus,
} from "../../../../lib/chat-records-store";

async function requireAuth() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function GET() {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const records = await getChatRecords();
  return Response.json({ ...records, storeConfigured: recordsStoreConfigured() });
}

export async function PATCH(request) {
  if (!(await requireAuth())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Bad JSON." }, { status: 400 });
  }

  const type = payload?.type === "appointment" ? "appointment" : "lead";
  const id = typeof payload?.id === "string" ? payload.id : "";
  const status = typeof payload?.status === "string" ? payload.status : "";
  if (!id || !status) {
    return Response.json({ error: "Missing record id or status." }, { status: 400 });
  }

  try {
    const res = await updateRecordStatus(type, id, status);
    return Response.json({ ok: true, persisted: res.persisted, storeConfigured: recordsStoreConfigured() });
  } catch (error) {
    return Response.json({ error: error.message || "Update failed." }, { status: 422 });
  }
}
