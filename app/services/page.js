import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SERVICE_PAGES } from "../seo-content";

export const metadata = {
  title: "Tire & Auto Services in San Jose, CA",
  description: "Explore new tires, flat repair, wheel alignment, brakes, oil changes, batteries, and custom wheels at Tires SOS Rescue in San Jose.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <><Header /><main className="seo-page"><div className="seo-page__inner">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Services</span></nav>
    <header className="seo-hero"><p className="seo-eyebrow">Tires SOS Rescue</p><h1>Tire and auto services in San Jose</h1><p>Practical help for the parts of your car that meet the road. Explore each service, then message our bilingual team for availability and a quote.</p></header>
    <section className="seo-card-grid" aria-label="Services">{Object.entries(SERVICE_PAGES).map(([slug, service]) => <article className="seo-card" key={slug}><h2><Link href={`/services/${slug}`}>{service.name}</Link></h2><p>{service.description}</p><Link className="seo-text-link" href={`/services/${slug}`}>Learn about {service.name.toLowerCase()} <span aria-hidden="true">→</span></Link></article>)}</section>
    <section className="seo-cta"><h2>Not sure what your car needs?</h2><p>Tell us what you drive and what you are noticing. We will help you choose the right next step.</p><Link className="btn btn--primary" href="/quote">Request a quote</Link></section>
  </div></main><Footer /></>;
}
