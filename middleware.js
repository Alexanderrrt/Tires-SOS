import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isDashboardUserAllowed } from "./lib/dashboard-auth";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)", "/api/dashboard(.*)"]);
const isPublicDashboardRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isDashboardRoute(request) && !isPublicDashboardRoute(request)) {
    await auth.protect();
    const { userId } = await auth();
    if (!isDashboardUserAllowed(userId)) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
});

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/api/dashboard(.*)",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/__clerk/:path*",
  ],
};
