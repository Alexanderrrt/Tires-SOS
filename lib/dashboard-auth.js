// Dashboard authorization is intentionally separate from Clerk authentication:
// a valid Clerk account is not sufficient unless its user ID is allowlisted.
const PREAUTHORIZED_USER_IDS = new Set([
  "user_3GPVlWy1PccGYKPwfHYkTlbKwkB",
]);

function configuredUserIds() {
  return String(process.env.DASHBOARD_ALLOWED_USER_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isDashboardUserAllowed(userId) {
  if (!userId) return false;
  return PREAUTHORIZED_USER_IDS.has(userId) || configuredUserIds().includes(userId);
}
