import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isAdminUserAllowed } from "../../lib/admin-auth";
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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/admin");
  if (!isAdminUserAllowed(userId)) redirect("/");

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
      />
    </main>
  );
}
