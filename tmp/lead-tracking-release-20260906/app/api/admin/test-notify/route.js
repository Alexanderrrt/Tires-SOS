import { isAdminAuthorized } from "../../../../lib/admin-auth";
import { notifyLead, notifyConfigured } from "../../../../lib/lead-notify";

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST() {
  if (!(await isAdminAuthorized())) {
    return json({ ok: false, status: "unauthorized", error: "Unauthorized." }, 401);
  }

  if (!notifyConfigured()) {
    return json({
      ok: false,
      status: "notification_not_configured",
      error: "The notification service is not configured.",
    }, 503);
  }

  try {
    const result = await notifyLead({
      type: "TEST",
      name: "Tires SOS Admin",
      phone: "N/A",
      message: "This is a test notification from the Tires SOS admin panel.",
    });

    if (!result.accepted) {
      return json({
        ok: false,
        accepted: false,
        status: result.status,
        error: "The notification provider did not accept the test message.",
      }, 503);
    }

    return json({ ok: true, accepted: true, status: result.status });
  } catch {
    return json({
      ok: false,
      accepted: false,
      status: "notification_failed",
      error: "The notification provider did not accept the test message.",
    }, 502);
  }
}
