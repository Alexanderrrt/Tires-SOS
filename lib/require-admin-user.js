// Defense-in-depth authorization for /api/admin/* handlers.
//
// clerkMiddleware already gates these routes, but several endpoints read
// and write sensitive data (ad credentials, leads, appointments) and must
// not rely on the middleware alone. Each handler calls this and returns the
// Response it yields when access is denied.
import { isAdminAuthorized } from "./admin-auth";

export async function requireAdminUser() {
  if (await isAdminAuthorized()) return null;
  return Response.json({ error: "Forbidden." }, { status: 403 });
}
