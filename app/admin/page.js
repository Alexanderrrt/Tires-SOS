import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, authConfigured, SESSION_COOKIE } from "../../lib/auth";
import { getPricing, storeConfigured } from "../../lib/pricing-store";
import PricingEditor from "./PricingEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Pricing",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const ok = await verifySession(token);
  if (!ok) redirect("/admin/login");

  const pricing = await getPricing();
  return (
    <main className="admin">
      <PricingEditor
        initialPricing={pricing}
        persistent={storeConfigured()}
        authReady={authConfigured()}
      />
    </main>
  );
}
