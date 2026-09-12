import {
  PLATFORMS,
  getAdConnections,
  setAdConnections,
  maskConnections,
} from "../../../../lib/ad-connections-store";
import { requireAdminUser } from "../../../../lib/require-admin-user";
import { getGoogleAdsMetrics } from "../../../../lib/google-ads-api";
import { getMetaAdsMetrics } from "../../../../lib/meta-ads-api";
import { getYelpMetrics } from "../../../../lib/yelp-api";

const CONNECTION_TESTS = {
  google_ads: (connection) => getGoogleAdsMetrics(connection, { days: 1 }),
  meta_ads: (connection) => getMetaAdsMetrics(connection, { days: 1 }),
  yelp: (connection) => getYelpMetrics(connection),
};

// Clerk middleware protects /api/admin(.*); requireAdminUser() re-checks
// in-handler as defense-in-depth because these routes handle ad credentials.

export async function GET() {
  const denied = await requireAdminUser();
  if (denied) return denied;
  const connections = await getAdConnections();
  return Response.json({ platforms: maskConnections(connections) });
}

export async function PUT(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const { platform, fields } = body || {};
  const def = PLATFORMS[platform];
  if (!def) {
    return Response.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  const connections = await getAdConnections();
  const candidate = structuredClone(connections);
  const entry = candidate[platform];

  for (const f of def.fields) {
    const value = fields?.[f.key];
    if (typeof value === "string" && value.trim() && !value.startsWith("••••")) {
      entry.fields[f.key] = value.trim();
    }
  }

  const missing = def.fields.filter((f) => f.required !== false && !entry.fields[f.key]).map((f) => f.label);
  if (missing.length > 0) {
    return Response.json(
      { error: `Missing: ${missing.join(", ")}`, platforms: maskConnections(connections) },
      { status: 422 }
    );
  }

  entry.connected = true;
  entry.connectedAt = new Date().toISOString();
  const connectionTest = await CONNECTION_TESTS[platform](entry);
  if (connectionTest?.error || connectionTest?.available === false) {
    return Response.json(
      { error: connectionTest.error || connectionTest.reason || "The platform rejected these credentials.", platforms: maskConnections(connections) },
      { status: 422 }
    );
  }
  const result = await setAdConnections(candidate);

  return Response.json({
    ok: true,
    persisted: result.persisted,
    warning: result.warning,
    platforms: maskConnections(candidate),
  });
}

export async function DELETE(request) {
  const denied = await requireAdminUser();
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const { platform } = body || {};
  if (!PLATFORMS[platform]) {
    return Response.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
  }

  const connections = await getAdConnections();
  connections[platform] = { connected: false, fields: {}, connectedAt: null };
  const result = await setAdConnections(connections);

  return Response.json({
    ok: true,
    persisted: result.persisted,
    platforms: maskConnections(connections),
  });
}
