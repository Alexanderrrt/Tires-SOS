// Defense-in-depth authorization for /api/dashboard/* handlers.
//
// clerkMiddleware already gates these routes, but the dashboard endpoints read
// and write ad-platform credentials and can send email, so they must not rely
// on the middleware alone (a matcher change or an upstream middleware-bypass
// bug would otherwise expose them). Each handler calls this and returns the
// Response it yields when access is denied. Mirrors the check the middleware
// and /api/admin/analytics-reports already perform.
import { auth } from "@clerk/nextjs/server";
import { isDashboardUserAllowed } from "./dashboard-auth";

export async function requireDashboardUser() {
  try {
    const { userId } = await auth();
    if (isDashboardUserAllowed(userId)) return null;
  } catch {
    // fall through to the forbidden response below
  }
  return Response.json({ error: "Forbidden." }, { status: 403 });
}
