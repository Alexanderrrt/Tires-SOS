import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SeoJsonLd from "../../components/SeoJsonLd";
import { LOCATION_PAGES, SERVICE_PAGES } from "../../seo-content";
import { SITE } from "../../site.config";

export function generateStaticParams() { return Object.keys(LOCATION_PAGES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const page = LOCATION_PAGES[slug]; if (!page) return {}; const loc = SITE.locations.find((item) => item.id === page.locationId); const description = `Visit Tires SOS Rescue at ${loc.full} for tires, flat repair, alignment, brakes, oil changes, batteries, and wheels.`; return { title: page.title, description, alternates: { canonical: `/locations/${slug}` }, openGraph: { title: `${page.title} | ${SITE.name}`, description, url: `/locations/${slug}` } }; }
export default async function LocationPage({ params }) {
  const { slug } = await params; const page = LOCATION_PAGES[slug]; if (!page) notFound(); const loc = SITE.locations.find((item) => item.id === page.locationId); const url = `${SITE.url}/locations/${slug}`;
  const schema = { "@context": "https://schema.org", "@graph": [{ "@type": ["TireShop", "AutoRepair"], "@id": `${url}#store`, name: `${SITE.name} — ${page.label}`, url, telephone: SITE.phone, priceRange: "$$", image: `${SITE.url}/storefront.jpg`, address: { "@type": "PostalAddress", streetAddress: loc.line1, addressLocality: "San Jose", addressRegion: "CA", postalCode: loc.postalCode, addressCountry: "US" }, hasMap: loc.mapsHref, parentOrganization: { "@id": `${SITE.url}/#organization` }, openingHoursSpecification: SITE.hours.filter((h) => h.open).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][h.day], opens: h.open, closes: h.close })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Locations", item: `${SITE.url}/locations` }, { "@type": "ListItem", position: 3, name: page.label, item: url }] }] };
  return <><Header /><SeoJsonLd data={schema} /><main className="seo-page"><div className="seo-page__inner">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/locations">Locations</Link><span aria-hidden="true">/</span><span>{page.label}</span></nav>
    <header className="seo-hero"><p className="seo-eyebrow">Tires SOS Rescue</p><h1>{page.title}</h1><p>Visit us at <strong>{loc.full}</strong> for friendly tire and auto care. Our team serves San Jose drivers in English and Spanish.</p><div className="seo-actions"><a className="btn btn--primary" href={loc.mapsHref} target="_blank" rel="noopener noreferrer">Get directions</a><a className="btn btn--ghost" href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">Message the shop</a></div></header>
    <section className="seo-split"><div><h2>Services at this location</h2><ul className="seo-link-list">{Object.entries(SERVICE_PAGES).map(([key, item]) => <li key={key}><Link href={`/services/${key}`}>{item.name}</Link></li>)}</ul></div><aside><h2>Shop hours</h2><dl className="seo-hours">{SITE.hours.map((h) => <div key={h.day}><dt>{h.label.en}</dt><dd>{h.open ? `${h.open}–${h.close}` : "Closed"}</dd></div>)}</dl></aside></section>
    <section className="seo-map"><h2>Find our {page.label} shop</h2><iframe title={`Map to ${SITE.name} at ${loc.full}`} src={loc.mapsEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section>
  </div></main><Footer /></>;
}
