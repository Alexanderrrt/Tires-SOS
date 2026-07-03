import { getPricing } from "../../../lib/pricing-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const pricing = await getPricing();
  return Response.json(pricing);
}
