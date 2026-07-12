import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Dashboard login
 * POST /api/dashboard/auth/login
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password required" }),
        { status: 400 }
      );
    }

    // Get user from database
    const { data: users, error: userError } = await supabase
      .from("dashboard_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (userError || !users) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    // Verify password (should use bcrypt in production)
    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    if (passwordHash !== users.password_hash) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401 }
      );
    }

    // Create session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { error: sessionError } = await supabase
      .from("dashboard_sessions")
      .insert([
        {
          user_id: users.id,
          token,
          ip_address: request.headers.get("x-forwarded-for") || "unknown",
          user_agent: request.headers.get("user-agent"),
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (sessionError) throw sessionError;

    // Update last login
    await supabase
      .from("dashboard_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", users.id);

    // Return session
    return new Response(
      JSON.stringify({
        success: true,
        token,
        user: {
          id: users.id,
          email: users.email,
          name: users.full_name,
          role: users.role,
        },
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": `dashboard_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
