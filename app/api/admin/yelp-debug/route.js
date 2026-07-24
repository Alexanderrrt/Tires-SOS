import { isAdminAuthorized } from "../../../../lib/admin-auth";
import {
  draftManualYelpReply,
  getYelpDebugMessageDetail,
  listYelpDebugMessages,
  sendManualYelpReply,
  YelpManualReplyError,
} from "../../../../lib/yelp-manual-responder";
import { GmailApiError } from "../../../../lib/gmail-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdmin() {
  return isAdminAuthorized();
}

function errorResponse(error) {
  const known = error instanceof YelpManualReplyError;
  const gmailRateLimited =
    error instanceof GmailApiError &&
    (error.status === 429 || ["rateLimitExceeded", "userRateLimitExceeded"].includes(error.reason));
  const retryAfterSeconds = gmailRateLimited
    ? Math.max(1, Math.ceil((error.retryAfterMs || 1_000) / 1_000))
    : 0;
  return Response.json(
    {
      error: error?.message || "Yelp debug request failed.",
      code: known ? error.code : "yelp_debug_error",
      retryAfterSeconds,
    },
    {
      status: known ? error.status : gmailRateLimited ? 429 : 500,
      headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined,
    },
  );
}

export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const messageId = url.searchParams.get("messageId");
    if (messageId) {
      return Response.json(await getYelpDebugMessageDetail(messageId), {
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      });
    }
    const days = url.searchParams.get("days") || 7;
    const result = await listYelpDebugMessages({ days, maxResults: 15 });
    return Response.json(result, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Yelp debug inbox inspection failed:", error);
    return errorResponse(error);
  }
}

export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "draft") {
      return Response.json(await draftManualYelpReply(body.gmailMessageId));
    }
    if (body.action === "send") {
      return Response.json(
        await sendManualYelpReply({
          gmailMessageId: body.gmailMessageId,
          replyText: body.replyText,
        }),
      );
    }
    return Response.json({ error: "Unsupported Yelp debug action." }, { status: 400 });
  } catch (error) {
    console.error("Yelp manual response action failed:", error);
    return errorResponse(error);
  }
}
