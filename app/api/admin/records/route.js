import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import {
  blockSlot,
  deleteRecord,
  getChatRecords,
  recordsStoreConfigured,
  scheduleAppointment,
  unblockSlot,
  unscheduleAppointment,
  updateRecordStatus,
} from "../../../../lib/chat-records-store";
import { deliverLeadNotification } from "../../../../lib/lead-notification-service";
import { validateShopSlot } from "../../../../lib/appointment-slots";
import { isValidDateKey, isValidTimeKey } from "../../../../lib/shop-time";

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

  const action = payload?.action;

  if (action === "block" || action === "unblock") {
    const date = typeof payload?.date === "string" ? payload.date : "";
    const time = typeof payload?.time === "string" ? payload.time : "";
    if (!isValidDateKey(date) || (time !== "all" && !isValidTimeKey(time))) {
      return Response.json({ error: "Invalid date or time." }, { status: 400 });
    }
    try {
      const res = action === "block" ? await blockSlot(date, time) : await unblockSlot(date, time);
      return Response.json({ ok: true, ...res, storeConfigured: recordsStoreConfigured() });
    } catch (error) {
      return Response.json({ error: error.message || "Block/unblock failed." }, { status: 422 });
    }
  }

  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) {
    return Response.json({ error: "Missing record id." }, { status: 400 });
  }

  if (action === "retry-notification") {
    try {
      const notification = await deliverLeadNotification({ id });
      return Response.json({ ok: true, notification, storeConfigured: recordsStoreConfigured() });
    } catch {
      return Response.json({ error: "Notification retry failed." }, { status: 503 });
    }
  }

  if (action === "schedule") {
    const scheduledDate = typeof payload?.scheduledDate === "string" ? payload.scheduledDate : "";
    const scheduledTime = typeof payload?.scheduledTime === "string" ? payload.scheduledTime : "";
    if (!scheduledDate || !scheduledTime) {
      return Response.json({ error: "Missing date or time." }, { status: 400 });
    }

    const validation = validateShopSlot(scheduledDate, scheduledTime, { maxDays: 365 });
    if (!validation.ok) {
      return Response.json({ error: validation.message, code: validation.code }, { status: 400 });
    }

    try {
      const res = await scheduleAppointment(id, scheduledDate, scheduledTime);
      return Response.json({ ok: true, persisted: res.persisted, appointment: res.appointment, storeConfigured: recordsStoreConfigured() });
    } catch (error) {
      const conflict = /booked|blocked|unavailable|conflict|unique/i.test(error?.message || "");
      return Response.json(
        { error: conflict ? "That time is unavailable." : "Schedule failed." },
        { status: conflict ? 409 : 422 },
      );
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
