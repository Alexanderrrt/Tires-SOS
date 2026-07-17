import { cookies } from "next/headers";
import { checkPassword, signSession, authConfigured, SESSION_COOKIE } from "../../../../lib/auth";
import { checkAdminLoginRateLimit, getClientIp } from "../../../../lib/chat-rate-limit";

export async function POST(request) {
  if (!authConfigured()) {
    return Response.json(
      { error: "Admin auth is not configured (set ADMIN_PASSWORD and AUTH_SECRET)." },
      { status: 503 }
    );
  }

  const rate = await checkAdminLoginRateLimit(getClientIp(request));
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  let password;
  try {
    ({ password } = await request.json());
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    // small delay to blunt brute-forcing
    await new Promise((r) => setTimeout(r, 400));
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await signSession();
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return Response.json({ ok: true });
}
