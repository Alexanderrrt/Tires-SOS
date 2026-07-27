import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ChatBot from "../../components/ChatBot";
import { SERVICE_PAGES, SITE } from "../../site.config";

export function generateStaticParams() {
  return Object.keys(SERVICE_PAGES).map((slug) => ({ slug }));
}

export function generateMetadata({ params }) {
  const page = SERVICE_PAGES[params.slug];
  if (!page) return {};
  return {
    title: `${page.title.en} | ${SITE.name}`,
    description: page.description.en,
    alternates: { canonical: `/services/${params.slug}` },
    openGraph: { title: page.title.en, description: page.description.en, url: `/services/${params.slug}` },
  };
}

export default function ServicePage({ params }) {
  const page = SERVICE_PAGES[params.slug];
  if (!page) notFound();
  return (
    <>
      <Header />
      <main className="service-page">
        <div className="service-page__inner">
          <p className="service-page__eyebrow">Tires SOS Rescue · San Jose, CA</p>
          <h1>{page.title.en}</h1>
          <p className="service-page__lead">{page.description.en}</p>
          <p>{page.body.en}</p>
          <div className="service-page__actions">
            <a className="btn btn--primary" href={SITE.whatsappHref} target="_blank" rel="noreferrer">Ask on WhatsApp</a>
            <Link className="btn btn--ghost" href="/#services">See all services</Link>
          </div>
          <div className="service-page__locations">
            <h2>Visit either San Jose location</h2>
            {SITE.locations.map((location) => <p key={location.id}><strong>{location.line1}</strong><br />{location.line2} · <a href={location.mapsHref} target="_blank" rel="noreferrer">Get directions</a></p>)}
            <p>Walk-ins welcome during shop hours. Shop service only; no roadside service or towing.</p>
          </div>
        </div>
      </main>
      <Footer />
      <ChatBot mode="shop" turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} />
    </>
  );
}
