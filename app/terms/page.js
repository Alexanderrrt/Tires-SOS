import LegalPage from "../legal/LegalPage";
import { LEGAL_PAGES } from "../legal/legal-content";

export const metadata = {
  title: "Terms of Use | Tires SOS Rescue",
  description: "Terms of use for Tires SOS Rescue in San Jose, CA.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage page={LEGAL_PAGES.terms} />;
}
