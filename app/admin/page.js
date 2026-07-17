import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, authConfigured, SESSION_COOKIE } from "../../lib/auth";
import { getPricing, storeConfigured } from "../../lib/pricing-store";
import { getChatSettings, chatStoreConfigured } from "../../lib/chat-settings-store";
import { getChatRecords, recordsStoreConfigured } from "../../lib/chat-records-store";
import { listRecentYelpLeads } from "../../lib/yelp-leads-store";
import { gmailConfigured } from "../../lib/gmail-client";
import { getWhatsAppGlobalBotEnabled, listWhatsAppConversations } from "../../lib/whatsapp-store";
import { whatsappConfigured } from "../../lib/whatsapp-client";
import PricingEditor from "./PricingEditor";
import "./whatsapp.css";
import "./admin-shell.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin - Tires SOS",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const ok = await verifySession(token);
  if (!ok) redirect("/admin/login");

  const [pricing, chatSettings, records, yelpLeads, whatsappConversations, whatsappGlobalBotEnabled] = await Promise.all([
    getPricing(),
    getChatSettings(),
    getChatRecords(),
    listRecentYelpLeads().catch(() => []),
    listWhatsAppConversations().catch(() => []),
    getWhatsAppGlobalBotEnabled().catch(() => false),
  ]);

  return (
    <main className="admin">
      <PricingEditor
        initialPricing={pricing}
        initialChatSettings={chatSettings}
        initialRecords={records}
        initialYelpLeads={yelpLeads}
        yelpConfigured={gmailConfigured()}
        initialWhatsAppConversations={whatsappConversations}
        initialWhatsAppGlobalBotEnabled={whatsappGlobalBotEnabled}
        whatsappConfigured={whatsappConfigured()}
        persistent={storeConfigured()}
        chatPersistent={chatStoreConfigured()}
        recordsPersistent={recordsStoreConfigured()}
        authReady={authConfigured()}
      />
    </main>
  );
}
