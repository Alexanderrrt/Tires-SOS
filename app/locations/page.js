import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { LOCATION_PAGES } from "../seo-content";
import { SITE } from "../site.config";

export const metadata = { title: "Tire Shop Locations in San Jose, CA", description: "Visit Tires SOS Rescue at two San Jose tire shop locations on East Taylor Street and North 10th Street. See addresses, hours, and directions.", alternates: { canonical: "/locations" } };
export default function LocationsPage() { return <><Header /><main className="seo-page"><div className="seo-page__inner">
  <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Locations</span></nav>
  <header className="seo-hero"><p className="seo-eyebrow">Local, bilingual service</p><h1>Tires SOS Rescue locations in San Jose</h1><p>Choose the shop that is most convenient for you. Both locations provide tire and auto services with help in English and Spanish.</p></header>
  <section className="seo-card-grid">{Object.entries(LOCATION_PAGES).map(([slug, page]) => { const loc = SITE.locations.find((item) => item.id === page.locationId); return <article className="seo-card" key={slug}><h2><Link href={`/locations/${slug}`}>{page.label}</Link></h2><p>{loc.full}</p><Link className="seo-text-link" href={`/locations/${slug}`}>Hours and directions →</Link></article>; })}</section>
</div></main><Footer /></>;
}
