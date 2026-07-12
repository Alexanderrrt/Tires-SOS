import LegalPage from "../legal/LegalPage";
import { LEGAL_PAGES } from "../legal/legal-content";

export const metadata = {
  title: "Privacy Policy | Tires SOS Rescue",
  description: "Privacy policy for Tires SOS Rescue in San Jose, CA.",
};

export default function PrivacyPolicyPage() {
  return <LegalPage page={LEGAL_PAGES.privacy} />;
}
