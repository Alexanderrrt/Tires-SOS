import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUserAllowed } from "./lib/admin-auth";

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
]);
const isPublicAdminRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
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
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/__clerk/:path*",
  ],
};
