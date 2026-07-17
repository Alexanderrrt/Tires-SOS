import {
  PLATFORMS,
  getAdConnections,
  setAdConnections,
  maskConnections,
} from "../../../../lib/ad-connections-store";
import { requireDashboardUser } from "../../../../lib/require-dashboard-user";

// Clerk middleware protects /api/dashboard(.*); requireDashboardUser() re-checks
// in-handler as defense-in-depth because these routes handle ad credentials.

export async function GET() {
  const denied = await requireDashboardUser();
  if (denied) return denied;
  const connections = await getAdConnections();
  return Response.json({ platforms: maskConnections(connections) });
}

export async function PUT(request) {
  const denied = await requireDashboardUser();
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
  const entry = connections[platform];

  // Merge only non-empty submitted values so masked/blank inputs keep
  // whatever is already saved.
  for (const f of def.fields) {
    const value = fields?.[f.key];
    if (typeof value === "string" && value.trim() && !value.startsWith("••••")) {
      entry.fields[f.key] = value.trim();
    }
  }

  const missing = def.fields.filter((f) => !entry.fields[f.key]).map((f) => f.label);
  if (missing.length > 0) {
    await setAdConnections(connections);
    return Response.json(
      { error: `Missing: ${missing.join(", ")}`, platforms: maskConnections(connections) },
      { status: 422 }
    );
  }

  entry.connected = true;
  entry.connectedAt = new Date().toISOString();
  const result = await setAdConnections(connections);

  return Response.json({
    ok: true,
    persisted: result.persisted,
    warning: result.warning,
    platforms: maskConnections(connections),
  });
}

export async function DELETE(request) {
  const denied = await requireDashboardUser();
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
