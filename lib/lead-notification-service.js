import {
  claimLeadNotification,
  getLeadById,
  getLeadBySession,
  recordNotificationResult,
} from "./chat-records-store";
import { notifyLead } from "./lead-notify";
import { formatShopSlot } from "./shop-time";

async function findLead(identifier) {
  if (typeof identifier === "object" && identifier?.id) return getLeadById(identifier.id);
  if (typeof identifier === "object" && identifier?.sessionId) return getLeadBySession(identifier.sessionId);
  if (typeof identifier !== "string" || !identifier) return null;
  return (await getLeadById(identifier)) || getLeadBySession(identifier);
}

function publicState(lead, fallbackStatus = "not_ready") {
  return {
    accepted: lead?.notificationStatus === "sent",
    status: lead?.notificationStatus || fallbackStatus,
    attempts: Number(lead?.notificationAttempts) || 0,
  };
}

export async function deliverLeadNotification(identifier) {
  const existing = await findLead(identifier);
  if (!existing) return { accepted: false, status: "lead_not_found", attempts: 0 };
  if (!existing.customerName || !existing.phone) return publicState(existing, "not_ready");
  if (!existing.preferredDate || !existing.preferredTime) return publicState(existing, "awaiting_time");
  if (existing.notificationStatus === "sent") return publicState(existing, "sent");

  const claim = await claimLeadNotification({ id: existing.id });
  if (!claim?.claimed || !claim.lead) return publicState(claim?.lead || existing, "pending");

  const lead = claim.lead;
  try {
    const result = await notifyLead({
      type: lead.source === "Quote chat" ? "QUOTE" : "CHAT",
      name: lead.customerName,
      phone: lead.phone,
      vehicle: lead.vehicle,
      tireSize: lead.tireSize,
      service: lead.service,
      preferredTime: formatShopSlot(lead.preferredDate, lead.preferredTime, lead.lang),
      message: lead.summary,
    });

    const updated = await recordNotificationResult(
      { id: lead.id },
      result.accepted
        ? { sent: true, status: "sent" }
        : { sent: false, status: result.status || "not_configured", reason: result.status || "not_configured" },
    );
    return publicState(updated.lead, result.status);
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "provider_unavailable";
    const updated = await recordNotificationResult(
      { id: lead.id },
      { sent: false, status: "failed", reason: code, lastErrorCode: code },
    );
    return publicState(updated.lead, "failed");
  }
}
