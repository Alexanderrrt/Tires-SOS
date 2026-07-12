import { oauthConfigured, consumeAuthorizationCode, issueAccessToken } from "../../../../lib/mcp-oauth";

export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readParams(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return new URLSearchParams(body);
  }
  const text = await request.text();
  return new URLSearchParams(text);
}

export async function POST(request) {
  if (!oauthConfigured()) return json({ error: "server_error" }, 503);

  const params = await readParams(request);
  const grantType = params.get("grant_type") || "";
  if (grantType !== "authorization_code") {
    return json({ error: "unsupported_grant_type" }, 400);
  }

  const code = params.get("code") || "";
  const redirectUri = params.get("redirect_uri") || "";
  const codeVerifier = params.get("code_verifier") || "";

  const valid = await consumeAuthorizationCode({ code, redirectUri, codeVerifier });
  if (!valid) return json({ error: "invalid_grant" }, 400);

  const { token, expiresIn } = await issueAccessToken();
  return json({ access_token: token, token_type: "Bearer", expires_in: expiresIn });
}
