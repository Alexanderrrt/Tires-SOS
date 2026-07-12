import { oauthConfigured, verifyPassword, issueAuthorizationCode } from "../../../../lib/mcp-oauth";

export const dynamic = "force-dynamic";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
}

function renderForm({ clientId, redirectUri, state, codeChallenge, scope, error }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Connect Tires SOS MCP</title>
<style>body{font-family:system-ui,sans-serif;max-width:420px;margin:80px auto;padding:0 16px}
input{width:100%;padding:10px;margin:8px 0;box-sizing:border-box}button{padding:10px 20px}</style>
</head><body>
<h2>Authorize access to Tires SOS shop tools</h2>
<p>Client "${escapeHtml(clientId)}" is requesting access.</p>
${error ? `<p style="color:red">${escapeHtml(error)}</p>` : ""}
<form method="POST">
<input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
<input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
<input type="hidden" name="state" value="${escapeHtml(state)}">
<input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
<input type="hidden" name="scope" value="${escapeHtml(scope)}">
<label>Shop access key</label>
<input type="password" name="password" autofocus required>
<button type="submit">Authorize</button>
</form>
</body></html>`;
}

function html(body, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
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

  const { clientId, redirectUri, state, codeChallenge, codeChallengeMethod, scope } = readParams(
    new URL(request.url),
  );
  if (!validRedirectUri(redirectUri)) return html("Missing or invalid redirect_uri.", 400);
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return html("This server requires PKCE with S256 (code_challenge_method=S256).", 400);
  }

  return html(renderForm({ clientId, redirectUri, state, codeChallenge, scope }));
}

export async function POST(request) {
  if (!oauthConfigured()) return html("OAuth is not configured on this server.", 503);

  const form = await request.formData();
  const clientId = String(form.get("client_id") || "");
  const redirectUri = String(form.get("redirect_uri") || "");
  const state = String(form.get("state") || "");
  const codeChallenge = String(form.get("code_challenge") || "");
  const scope = String(form.get("scope") || "");
  const password = String(form.get("password") || "");

  if (!validRedirectUri(redirectUri) || !codeChallenge) {
    return html("Invalid authorization request.", 400);
  }

  if (!verifyPassword(password)) {
    return html(
      renderForm({ clientId, redirectUri, state, codeChallenge, scope, error: "Incorrect access key." }),
      401,
    );
  }

  const code = await issueAuthorizationCode({ redirectUri, codeChallenge });
  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);

  return Response.redirect(target.toString(), 302);
}
