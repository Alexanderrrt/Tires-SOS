export const YELP_TRUSTED_SENDER_DOMAINS = new Set(["yelp.com", "messaging.yelp.com"]);
export const YELP_REPLYABLE_DOMAIN = "messaging.yelp.com";

export function emailDomain(address) {
  const value = String(address || "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  return at >= 0 ? value.slice(at + 1) : "";
}

export function matchesCurrentYelpAutomationQuery({ fromAddress, subject }) {
  const domain = emailDomain(fromAddress);
  const value = String(subject || "");
  if (/^re:/i.test(value)) return false;
  if (domain === "messaging.yelp.com") {
    return /for Tires SOS Rescue/i.test(value) || /New Lead:/i.test(value);
  }
  return domain === "yelp.com" && /New Reply Message from/i.test(value);
}

export function isRelevantYelpDebugEmail({ fromAddress, isFollowUpNotification, hasStoredLead = false }) {
  const domain = emailDomain(fromAddress);
  return (
    domain === "messaging.yelp.com" ||
    (domain === "yelp.com" && Boolean(isFollowUpNotification)) ||
    Boolean(hasStoredLead)
  );
}

export function diagnoseYelpMessage({
  fromAddress,
  replyToAddress,
  subject,
  isFollowUpNotification,
  unread,
  hasSentReply,
  storedStatus,
  receivedAt,
  watermarkMs,
}) {
  const trustedSender = YELP_TRUSTED_SENDER_DOMAINS.has(emailDomain(fromAddress));
  const replyableAddress = emailDomain(replyToAddress) === YELP_REPLYABLE_DOMAIN;
  const matchesAutomationQuery = matchesCurrentYelpAutomationQuery({ fromAddress, subject });
  const receivedMs = receivedAt ? new Date(receivedAt).getTime() : NaN;
  const afterWatermark =
    !Number.isFinite(Number(watermarkMs)) ||
    !Number.isFinite(receivedMs) ||
    receivedMs > Number(watermarkMs);
  const alreadyReplied = Boolean(hasSentReply) || storedStatus === "replied";
  const canReply =
    trustedSender &&
    replyableAddress &&
    !isFollowUpNotification &&
    !alreadyReplied;

  let code = "ready_manual_reply";
  let label = "Ready for manual reply";
  if (alreadyReplied) {
    code = "already_replied";
    label = "A sent reply already exists";
  } else if (!trustedSender) {
    code = "untrusted_sender";
    label = "Sender is not a verified Yelp domain";
  } else if (isFollowUpNotification) {
    code = "follow_up_yelp_only";
    label = "Follow-up must be answered in Yelp";
  } else if (!replyableAddress) {
    code = "no_yelp_relay";
    label = "No safe Yelp reply relay found";
  } else if (storedStatus === "failed") {
    code = "previous_send_failed";
    label = "Previous automatic send failed; manual reply is available";
  } else if (storedStatus === "pending") {
    code = "pending_record";
    label = "Lead is pending and can be handled manually";
  } else if (!matchesAutomationQuery) {
    code = "subject_not_matched";
    label = "Current automation does not recognize this subject";
  } else if (!unread) {
    code = "already_read";
    label = "Message was already read, so automation skipped it";
  } else if (!afterWatermark) {
    code = "before_watermark";
    label = "Message is older than the responder checkpoint";
  } else {
    code = "automation_eligible";
    label = "Eligible for automation; manual reply is also available";
  }

  return {
    trustedSender,
    replyableAddress,
    matchesAutomationQuery,
    afterWatermark,
    alreadyReplied,
    canDraft: canReply,
    canSend: canReply,
    needsAttention: canReply && storedStatus !== "replied",
    diagnosis: { code, label },
  };
}
