import Header from "../components/Header";
import Footer from "../components/Footer";
import QuoteIntro from "./QuoteIntro";
import QuoteLeadStarter from "./QuoteLeadStarter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Get a Quote / Cotizar | Tires SOS Rescue",
  description:
    "AI-assisted quote starter for tires, brakes, oil changes, alignment and more at Tires SOS Rescue in San Jose, CA. Ask the shop assistant for a quote and get guided from there.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <Header />
      <main className="section">
        <div className="section__inner">
          <QuoteIntro />
          <QuoteLeadStarter turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
        </div>
      </main>
      <Footer />
    </>
  );
}
