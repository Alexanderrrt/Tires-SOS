export const dynamic = "force-dynamic";

export async function GET(request) {
  const origin = new URL(request.url).origin;
  return Response.json({
    issuer: origin,
    authorization_endpoint: `${origin}/api/mcp/authorize`,
    token_endpoint: `${origin}/api/mcp/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
}
