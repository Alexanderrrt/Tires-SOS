import LegalPage from "../legal/LegalPage";
import { LEGAL_PAGES } from "../legal/legal-content";

export const metadata = {
  title: "Site Disclaimer | Tires SOS Rescue",
  description: "Important disclaimers for estimates, chat, and third-party services at Tires SOS Rescue.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return <LegalPage page={LEGAL_PAGES.disclaimer} />;
}
