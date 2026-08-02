import { getPublicLocations } from "../../../lib/location-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ locations: await getPublicLocations() }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
