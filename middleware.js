import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUserAllowed } from "./lib/admin-auth";

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);
const isPublicAdminRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isDisabledAdsRoute = createRouteMatcher([
  "/api/admin/ads-metrics(.*)",
  "/api/admin/ads-connections(.*)",
  "/api/admin/ads-alerts(.*)",
  "/api/admin/run-optimization(.*)",
  "/api/admin/send-report-email(.*)",
  "/api/cron/optimize-ads(.*)",
  "/api/cron/super-smart-optimize(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isDisabledAdsRoute(request)) {
    return NextResponse.json({ error: "Advertising features are disabled." }, { status: 410 });
  }
  const isReportPublisher =
    request.method === "POST" && request.nextUrl.pathname === "/api/admin/analytics-reports";

  if (isAdminRoute(request) && !isPublicAdminRoute(request) && !isReportPublisher) {
    await auth.protect();
    const { userId } = await auth();
    if (!isAdminUserAllowed(userId)) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/admin(.*)",
    "/api/admin(.*)",
    "/api/cron/optimize-ads(.*)",
    "/api/cron/super-smart-optimize(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/__clerk/:path*",
  ],
};
