import Header from "../components/Header";
import Footer from "../components/Footer";
import QuoteCalculator from "./QuoteCalculator";
import QuoteIntro from "./QuoteIntro";
import { getPricing } from "../../lib/pricing-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get a Quote — Tires SOS Rescue | Tire & Auto Estimate, San José",
  description:
    "Instant price estimate for tires, brakes, oil changes, alignment and more at Tires SOS Rescue in San José, CA. Pick your vehicle and services, get a ballpark, confirm on WhatsApp.",
  alternates: { canonical: "/quote" },
};

export default async function QuotePage() {
  const pricing = await getPricing();
  return (
    <>
      <Header />
      <main className="section">
        <div className="section__inner">
          <QuoteIntro />
          <QuoteCalculator pricing={pricing} />
        </div>
      </main>
      <Footer />
    </>
  );
}
