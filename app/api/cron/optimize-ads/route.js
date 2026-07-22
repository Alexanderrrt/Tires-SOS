import { timingSafeEqual } from "node:crypto";
import { runAdsOptimizationWorkflow } from "@/lib/ads-optimization-workflow";
import { sendErrorAlert } from "@/lib/send-report";

function authorized(request) {
  const expected = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function handle(request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";
  try {
    const result = await runAdsOptimizationWorkflow({ dryRun });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error in ad optimization workflow:", error);
    if (!dryRun) {
      try {
        await sendErrorAlert("Ad Optimization Error", error);
      } catch (notificationError) {
        console.error("Could not send optimization error alert:", notificationError);
      }
    }
    return Response.json(
      { success: false, dryRun, error: error?.message || "Optimization failed.", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
