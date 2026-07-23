import test from "node:test";
import assert from "node:assert/strict";
import {
  diagnoseYelpMessage,
  isRelevantYelpDebugEmail,
  matchesCurrentYelpAutomationQuery,
} from "../lib/yelp-manual-rules.js";

const BASE = {
  fromAddress: "reply+abc123@messaging.yelp.com",
  replyToAddress: "reply+abc123@messaging.yelp.com",
  subject: "New Lead: Reply to Maria's tire request",
  isFollowUpNotification: false,
  unread: true,
  hasSentReply: false,
  storedStatus: null,
  receivedAt: "2026-07-23T15:50:00.000Z",
  watermarkMs: new Date("2026-07-23T15:45:00.000Z").getTime(),
};

test("recognizes the current automatic responder subject families", () => {
  assert.equal(matchesCurrentYelpAutomationQuery(BASE), true);
  assert.equal(
    matchesCurrentYelpAutomationQuery({
      fromAddress: "reply+abc123@messaging.yelp.com",
      subject: "A new customer wants mobile tire service",
    }),
    false,
  );
  assert.equal(
    matchesCurrentYelpAutomationQuery({
      fromAddress: "no-reply@yelp.com",
      subject: "New Reply Message from Maria",
    }),
    true,
  );
});

test("allows a safe missed or unread Yelp relay message to be handled manually", () => {
  const result = diagnoseYelpMessage(BASE);
  assert.equal(result.canDraft, true);
  assert.equal(result.canSend, true);
  assert.equal(result.needsAttention, true);
  assert.equal(result.diagnosis.code, "automation_eligible");
});

test("explains read messages that the automatic unread query missed", () => {
  const result = diagnoseYelpMessage({ ...BASE, unread: false });
  assert.equal(result.canSend, true);
  assert.equal(result.diagnosis.code, "already_read");
});

test("blocks a second reply when Gmail already has a sent message in the thread", () => {
  const result = diagnoseYelpMessage({ ...BASE, hasSentReply: true });
  assert.equal(result.canDraft, false);
  assert.equal(result.canSend, false);
  assert.equal(result.diagnosis.code, "already_replied");
});

test("blocks Yelp follow-ups and non-Yelp reply targets", () => {
  const followUp = diagnoseYelpMessage({
    ...BASE,
    fromAddress: "no-reply@yelp.com",
    replyToAddress: "",
    subject: "New Reply Message from Maria",
    isFollowUpNotification: true,
  });
  assert.equal(followUp.canSend, false);
  assert.equal(followUp.diagnosis.code, "follow_up_yelp_only");

  const injected = diagnoseYelpMessage({
    ...BASE,
    replyToAddress: "attacker@example.com",
  });
  assert.equal(injected.canSend, false);
  assert.equal(injected.diagnosis.code, "no_yelp_relay");
});

test("marks nonmatching subjects as manually replyable but outside automation", () => {
  const result = diagnoseYelpMessage({
    ...BASE,
    subject: "New quote request from Yelp",
  });
  assert.equal(result.canSend, true);
  assert.equal(result.matchesAutomationQuery, false);
  assert.equal(result.diagnosis.code, "subject_not_matched");
});

test("keeps customer conversations and hides Yelp marketing newsletters", () => {
  assert.equal(
    isRelevantYelpDebugEmail({
      fromAddress: "reply+abc123@messaging.yelp.com",
      isFollowUpNotification: false,
    }),
    true,
  );
  assert.equal(
    isRelevantYelpDebugEmail({
      fromAddress: "no-reply@yelp.com",
      isFollowUpNotification: true,
    }),
    true,
  );
  assert.equal(
    isRelevantYelpDebugEmail({
      fromAddress: "no-reply@mail.yelp.com",
      isFollowUpNotification: false,
    }),
    false,
  );
});
