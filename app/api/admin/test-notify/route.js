import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "../../../../lib/auth";
import { notifyLead, notifyConfigured } from "../../../../lib/lead-notify";

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!notifyConfigured()) {
    return Response.json({
      ok: false,
      error: "EMAILJS env vars not configured. Set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY.",
    }, { status: 400 });
  }

  try {
    const result = await notifyLead({
      type: "TEST",
      name: "Tires SOS Admin",
      phone: "N/A",
      message: "This is a test notification from your Tires SOS admin panel. If you received this SMS, notifications are working.",
    });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
