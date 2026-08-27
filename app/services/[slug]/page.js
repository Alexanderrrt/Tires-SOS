import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SeoJsonLd from "../../components/SeoJsonLd";
import { ServiceLandingView } from "../../components/SeoViews";
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
  return <><Header /><SeoJsonLd data={schema} /><ServiceLandingView slug={slug} service={service} /><Footer /></>;
}
