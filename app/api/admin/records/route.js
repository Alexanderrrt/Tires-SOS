import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import {
  deleteRecord,
  getChatRecords,
  recordsStoreConfigured,
  scheduleAppointment,
  unscheduleAppointment,
  updateRecordStatus,
} from "../../../../lib/chat-records-store";
import { SITE } from "../../../site.config";

async function requireAuth() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

function validateBusinessHours(scheduledDate, scheduledTime) {
  const date = new Date(scheduledDate + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "Invalid date.";

  const dayOfWeek = date.getDay();
  const hours = SITE.hours.find((h) => h.day === dayOfWeek);
  if (!hours || !hours.open) return "Shop is closed on this day.";

  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const [slotH, slotM] = scheduledTime.split(":").map(Number);
  if (Number.isNaN(slotH) || Number.isNaN(slotM)) return "Invalid time.";

  const slot = slotH * 60 + slotM;
  const open = openH * 60 + openM;
  const close = closeH * 60 + closeM;
  if (slot < open || slot >= close) return "Time is outside business hours.";

  return null;
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

  const action = payload?.action;
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) {
    return Response.json({ error: "Missing record id." }, { status: 400 });
  }

  if (action === "schedule") {
    const scheduledDate = typeof payload?.scheduledDate === "string" ? payload.scheduledDate : "";
    const scheduledTime = typeof payload?.scheduledTime === "string" ? payload.scheduledTime : "";
    if (!scheduledDate || !scheduledTime) {
      return Response.json({ error: "Missing date or time." }, { status: 400 });
    }

    const hoursError = validateBusinessHours(scheduledDate, scheduledTime);
    if (hoursError) {
      return Response.json({ error: hoursError }, { status: 400 });
    }

    try {
      const res = await scheduleAppointment(id, scheduledDate, scheduledTime);
      return Response.json({ ok: true, persisted: res.persisted, appointment: res.appointment, storeConfigured: recordsStoreConfigured() });
    } catch (error) {
      return Response.json({ error: error.message || "Schedule failed." }, { status: 422 });
    }
  }

  if (action === "unschedule") {
    try {
      const res = await unscheduleAppointment(id);
      return Response.json({ ok: true, persisted: res.persisted, storeConfigured: recordsStoreConfigured() });
    } catch (error) {
      return Response.json({ error: error.message || "Unschedule failed." }, { status: 422 });
    }
  }

  const type = payload?.type === "appointment" ? "appointment" : "lead";
  const status = typeof payload?.status === "string" ? payload.status : "";
  if (!status) {
    return Response.json({ error: "Missing record status." }, { status: 400 });
  }

  try {
    const res = await updateRecordStatus(type, id, status);
    return Response.json({ ok: true, persisted: res.persisted, storeConfigured: recordsStoreConfigured() });
  } catch (error) {
    return Response.json({ error: error.message || "Update failed." }, { status: 422 });
  }
}

export async function DELETE(request) {
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
  if (!id) {
    return Response.json({ error: "Missing record id." }, { status: 400 });
  }

  try {
    const res = await deleteRecord(type, id);
    return Response.json({
      ok: true,
      persisted: res.persisted,
      deleted: res.deleted,
      storeConfigured: recordsStoreConfigured(),
    });
  } catch (error) {
    return Response.json({ error: error.message || "Delete failed." }, { status: 422 });
  }
}
