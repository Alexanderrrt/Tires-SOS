import { oauthConfigured, verifyPassword, issueAuthorizationCode } from "../../../../lib/mcp-oauth";

export const dynamic = "force-dynamic";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

function renderForm({ clientId, redirectUri, state, codeChallenge, scope, error }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Connect Tires SOS MCP</title>
<style>body{color:#f7f7f7;background:#0b0b0b;font-family:system-ui,sans-serif;max-width:440px;margin:80px auto;padding:0 18px}main{border:1px solid #333;border-radius:14px;padding:24px;background:#151515}h2{margin-top:0}input{width:100%;padding:12px;margin:8px 0 16px;box-sizing:border-box;color:#fff;background:#080808;border:1px solid #555;border-radius:8px}button{padding:11px 20px;border:0;border-radius:8px;background:#f15a24;color:white;font-weight:700}</style>
</head><body><main>
<h2>Authorize Tires SOS shop tools</h2>
<p>Client “${escapeHtml(clientId)}” is requesting access to pricing, availability, and appointment booking.</p>
${error ? `<p style="color:#ff7b7b">${escapeHtml(error)}</p>` : ""}
<form method="POST">
<input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
<input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
<input type="hidden" name="state" value="${escapeHtml(state)}">
<input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
<input type="hidden" name="scope" value="${escapeHtml(scope)}">
<label>Shop access key</label>
<input type="password" name="password" autocomplete="current-password" autofocus required>
<button type="submit">Authorize</button>
</form></main></body></html>`;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function readParams(url) {
  return {
    clientId: url.searchParams.get("client_id") || "",
    redirectUri: url.searchParams.get("redirect_uri") || "",
    state: url.searchParams.get("state") || "",
    codeChallenge: url.searchParams.get("code_challenge") || "",
    codeChallengeMethod: url.searchParams.get("code_challenge_method") || "",
    scope: url.searchParams.get("scope") || "",
  };
}

function validRedirectUri(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!oauthConfigured()) return html("OAuth is not configured on this server.", 503);
  const params = readParams(new URL(request.url));
  if (!validRedirectUri(params.redirectUri)) return html("Missing or invalid redirect_uri.", 400);
  if (!params.codeChallenge || params.codeChallengeMethod !== "S256") {
    return html("This server requires PKCE with S256.", 400);
  }
  return html(renderForm(params));
}

export async function POST(request) {
  if (!oauthConfigured()) return html("OAuth is not configured on this server.", 503);

  const form = await request.formData();
  const params = {
    clientId: String(form.get("client_id") || ""),
    redirectUri: String(form.get("redirect_uri") || ""),
    state: String(form.get("state") || ""),
    codeChallenge: String(form.get("code_challenge") || ""),
    scope: String(form.get("scope") || ""),
  };
  const password = String(form.get("password") || "");

  if (!validRedirectUri(params.redirectUri) || !params.codeChallenge) {
    return html("Invalid authorization request.", 400);
  }
  if (!verifyPassword(password)) {
    return html(renderForm({ ...params, error: "Incorrect access key." }), 401);
  }

  const code = await issueAuthorizationCode(params);
  const target = new URL(params.redirectUri);
  target.searchParams.set("code", code);
  if (params.state) target.searchParams.set("state", params.state);
  return Response.redirect(target.toString(), 302);
}
