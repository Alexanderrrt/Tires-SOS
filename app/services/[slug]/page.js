import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SeoJsonLd from "../../components/SeoJsonLd";
import { SITE } from "../../site.config";
import { SERVICE_PAGES } from "../../seo-content";

export function generateStaticParams() { return Object.keys(SERVICE_PAGES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params; const service = SERVICE_PAGES[slug];
  if (!service) return {};
  return { title: service.title, description: service.description, alternates: { canonical: `/services/${slug}` }, openGraph: { title: `${service.title} | ${SITE.name}`, description: service.description, url: `/services/${slug}`, type: "website" } };
}

export default async function ServicePage({ params }) {
  const { slug } = await params; const service = SERVICE_PAGES[slug]; if (!service) notFound();
  const url = `${SITE.url}/services/${slug}`;
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Service", "@id": `${url}#service`, name: service.name, description: service.description, serviceType: service.name, areaServed: { "@type": "City", name: "San Jose" }, provider: { "@id": `${SITE.url}/#organization` }, url },
    { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: service.faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE.url }, { "@type": "ListItem", position: 2, name: "Services", item: `${SITE.url}/services` }, { "@type": "ListItem", position: 3, name: service.name, item: url }] }
  ] };
  return <><Header /><SeoJsonLd data={schema} /><main className="seo-page"><div className="seo-page__inner">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/services">Services</Link><span aria-hidden="true">/</span><span>{service.name}</span></nav>
    <header className="seo-hero"><p className="seo-eyebrow">San Jose tire & auto care</p><h1>{service.title}</h1><p>{service.intro}</p><div className="seo-actions"><Link className="btn btn--primary" href="/quote">Request a quote</Link><a className="btn btn--ghost" href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a></div></header>
    <section className="seo-split"><div><h2>What to expect</h2><ul className="seo-checklist">{service.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></div><aside><h2>Two San Jose shops</h2><p>Choose our East Taylor Street or North 10th Street location. Walk-ins are welcome; messaging first is best for product availability.</p><Link className="seo-text-link" href="/locations">View locations and hours →</Link></aside></section>
    <section className="seo-faq"><h2>{service.name} FAQs</h2>{service.faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    <section className="seo-related"><h2>Other services</h2><div>{Object.entries(SERVICE_PAGES).filter(([key]) => key !== slug).slice(0, 4).map(([key, item]) => <Link key={key} href={`/services/${key}`}>{item.name}</Link>)}</div></section>
  </div></main><Footer /></>;
}
