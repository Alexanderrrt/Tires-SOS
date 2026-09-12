// Admin panel authorization: a valid Clerk account is not sufficient unless
// its user ID is allowlisted.
import { auth } from "@clerk/nextjs/server";

const PREAUTHORIZED_USER_IDS = new Set([
  "user_3GPVlWy1PccGYKPwfHYkTlbKwkB",
]);

function configuredUserIds() {
  return String(process.env.ADMIN_ALLOWED_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminUserAllowed(userId) {
  if (!userId) return false;
  return PREAUTHORIZED_USER_IDS.has(userId) || configuredUserIds().includes(userId);
}

export async function isAdminAuthorized() {
  try {
    const { userId } = await auth();
    return isAdminUserAllowed(userId);
  } catch {
    return false;
  }
}
