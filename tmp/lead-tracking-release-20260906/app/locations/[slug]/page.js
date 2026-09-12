import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SeoJsonLd from "../../components/SeoJsonLd";
import { LocationLandingView } from "../../components/SeoViews";
import { LOCATION_PAGES } from "../../seo-content";
import { SITE } from "../../site.config";

export function generateStaticParams() { return Object.keys(LOCATION_PAGES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const page = LOCATION_PAGES[slug]; if (!page) return {}; const loc = SITE.locations.find((item) => item.id === page.locationId); const description = `Visit Tires SOS Rescue at ${loc.full} for tires, flat repair, alignment, brakes, oil changes, batteries, and wheels.`; return { title: page.title, description, alternates: { canonical: `/locations/${slug}` }, openGraph: { title: `${page.title} | ${SITE.name}`, description, url: `/locations/${slug}` } }; }
export default async function LocationPage({ params }) {
  const { slug } = await params; const page = LOCATION_PAGES[slug]; if (!page) notFound(); const loc = SITE.locations.find((item) => item.id === page.locationId); const url = `${SITE.url}/locations/${slug}`;
  const city = loc.city || loc.line2.split(",")[0];
  const schema = { "@context": "https://schema.org", "@graph": [{ "@type": ["TireShop", "AutoRepair"], "@id": `${url}#store`, name: `${SITE.name} — ${page.label}`, url, telephone: loc.phone || SITE.phone, priceRange: "$$", image: `${SITE.url}/storefront.jpg`, address: { "@type": "PostalAddress", streetAddress: loc.line1, addressLocality: city.replace(", CA", ""), addressRegion: "CA", postalCode: loc.postalCode, addressCountry: "US" }, hasMap: loc.mapsHref, parentOrganization: { "@id": `${SITE.url}/#organization` }, openingHoursSpecification: SITE.hours.filter((h) => h.open).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][h.day], opens: h.open, closes: h.close })) }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Locations", item: `${SITE.url}/locations` }, { "@type": "ListItem", position: 3, name: page.label, item: url }] }] };
  return <><Header /><SeoJsonLd data={schema} /><LocationLandingView page={page} loc={loc} /><Footer /></>;
}
