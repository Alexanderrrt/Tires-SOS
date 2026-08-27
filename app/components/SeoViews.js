"use client";

import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";
import { SEO_ES } from "../seo-translations";
import { SERVICE_PAGES } from "../seo-content";
import { SITE } from "../site.config";

const UI = {
  services: { en: "Services", es: "Servicios" }, locations: { en: "Locations", es: "Ubicaciones" }, home: { en: "Home", es: "Inicio" },
  serviceTitle: { en: "Tire and auto services in San Jose and Hayward", es: "Servicios de llantas y auto en San José y Hayward" },
  serviceIntro: { en: "Practical help for the parts of your car that meet the road. Explore each service, then message our bilingual team for availability and a quote.", es: "Ayuda práctica para las partes de tu auto que tocan el camino. Explora cada servicio y escríbenos para consultar disponibilidad y cotización." },
  learn: { en: "Learn about", es: "Conoce más sobre" }, unsure: { en: "Not sure what your car needs?", es: "¿No sabes qué necesita tu auto?" },
  unsureBody: { en: "Tell us what you drive and what you are noticing. We will help you choose the right next step.", es: "Cuéntanos qué vehículo manejas y qué has notado. Te ayudaremos a elegir el siguiente paso." },
  quote: { en: "Request a quote", es: "Solicitar cotización" }, local: { en: "Local, bilingual service", es: "Servicio local y bilingüe" },
  locationsTitle: { en: "Tires SOS Rescue locations in San Jose", es: "Ubicaciones de Tires SOS Rescue en San José" },
  locationsIntro: { en: "Choose the shop that is most convenient for you. Both locations provide tire and auto services with help in English and Spanish.", es: "Elige el taller que te quede más cerca. Ambas ubicaciones ofrecen servicios de llantas y auto con atención en inglés y español." },
  hoursDirections: { en: "Hours and directions", es: "Horario y cómo llegar" }, expect: { en: "What to expect", es: "Qué puedes esperar" },
  twoShops: { en: "Three Bay Area shops", es: "Tres talleres en el Área de la Bahía" },
  twoShopsBody: { en: "Choose East Taylor Street, North 10th Street, or West A Street in Hayward. Walk-ins are welcome; messaging first is best for product availability.", es: "Elige East Taylor Street, North 10th Street o West A Street en Hayward. Atendemos sin cita; escríbenos primero para confirmar disponibilidad." },
  viewLocations: { en: "View locations and hours", es: "Ver ubicaciones y horarios" }, other: { en: "Other services", es: "Otros servicios" },
  faqs: { en: "FAQs", es: "Preguntas frecuentes" }, sanJoseCare: { en: "San Jose tire & auto care", es: "Llantas y servicio automotriz en San José" },
  whatsapp: { en: "Message on WhatsApp", es: "Escribir por WhatsApp" }, servicesHere: { en: "Services at this location", es: "Servicios en esta ubicación" },
  shopHours: { en: "Shop hours", es: "Horario del taller" }, find: { en: "Find our", es: "Encuentra nuestro taller de" }, directions: { en: "Get directions", es: "Cómo llegar" },
  visit: { en: "Visit us at", es: "Visítanos en" }, visitTail: { en: "for friendly tire and auto care. Our team serves San Jose drivers in English and Spanish.", es: "para un servicio amable de llantas y auto. Atendemos a conductores de San José en inglés y español." },
};

const SERVICE_IMAGES = {
  "new-tires": "/service-media/new-tires.jpg",
  "flat-tire-repair": "/service-media/flat-repair.jpg",
  "wheel-alignment": "/service-media/alignment.jpg",
  "brake-service": "/service-media/brakes.jpg",
  "oil-change": "/service-media/oil-change.jpg",
  "car-batteries": "/service-media/batteries.jpg",
  "custom-wheels": "/service-media/rims.jpg",
};

function useCopy() { const { lang } = useLanguage(); return { lang, t: (field) => field[lang] || field.en }; }
function localizedService(slug, service, lang) { return lang === "es" ? SEO_ES[slug] : service; }

export function ServicesHubView() {
  const { lang, t } = useCopy();
  return <main className="seo-page"><div className="seo-page__inner"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t(UI.home)}</Link><span>/</span><span>{t(UI.services)}</span></nav><header className="seo-hero seo-hero--with-media"><div className="seo-hero__copy"><p className="seo-eyebrow">Tires SOS Rescue</p><h1>{t(UI.serviceTitle)}</h1><p>{t(UI.serviceIntro)}</p></div><div className="seo-hero__media"><img src="/storefront-3-locations.png" alt="Tires SOS Rescue shops in San Jose and Hayward" /><span>San José · Hayward</span></div></header><section className="seo-card-grid" aria-label={t(UI.services)}>{Object.entries(SERVICE_PAGES).map(([slug, service]) => { const item = localizedService(slug, service, lang); return <article className="seo-card seo-card--service" key={slug}><Link className="seo-card__media" href={`/services/${slug}`}><img src={SERVICE_IMAGES[slug]} alt="" /></Link><div className="seo-card__body"><h2><Link href={`/services/${slug}`}>{item.name}</Link></h2><p>{item.description}</p><Link className="seo-text-link" href={`/services/${slug}`}>{t(UI.learn)} {item.name.toLowerCase()} →</Link></div></article>; })}</section><section className="seo-cta"><h2>{t(UI.unsure)}</h2><p>{t(UI.unsureBody)}</p><Link className="btn btn--primary" href="/quote">{t(UI.quote)}</Link></section></div></main>;
}

export function ServiceLandingView({ slug, service }) {
  const { lang, t } = useCopy(); const item = localizedService(slug, service, lang);
  return <main className="seo-page"><div className="seo-page__inner"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t(UI.home)}</Link><span>/</span><Link href="/services">{t(UI.services)}</Link><span>/</span><span>{item.name}</span></nav><header className="seo-hero seo-hero--with-media"><div className="seo-hero__copy"><p className="seo-eyebrow">{t(UI.sanJoseCare)}</p><h1>{lang === "es" ? `${item.name} en San José, CA` : service.title}</h1><p>{item.intro}</p><div className="seo-actions"><Link className="btn btn--primary" href="/quote">{t(UI.quote)}</Link><a className="btn btn--ghost" href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">{t(UI.whatsapp)}</a></div></div><div className="seo-hero__media"><img src={SERVICE_IMAGES[slug]} alt={item.name} /><span>{item.name}</span></div></header><section className="seo-split"><div><h2>{t(UI.expect)}</h2><ul className="seo-checklist">{item.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></div><aside><h2>{t(UI.twoShops)}</h2><p>{t(UI.twoShopsBody)}</p><Link className="seo-text-link" href="/locations">{t(UI.viewLocations)} →</Link></aside></section><section className="seo-faq"><h2>{item.name}: {t(UI.faqs)}</h2>{item.faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section><section className="seo-related"><h2>{t(UI.other)}</h2><div>{Object.entries(SERVICE_PAGES).filter(([key]) => key !== slug).slice(0, 4).map(([key, value]) => <Link key={key} href={`/services/${key}`}>{localizedService(key, value, lang).name}</Link>)}</div></section></div></main>;
}

export function LocationsHubView({ locations }) {
  const { lang, t } = useCopy();
  return <main className="seo-page"><div className="seo-page__inner"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t(UI.home)}</Link><span>/</span><span>{t(UI.locations)}</span></nav><header className="seo-hero seo-hero--with-media"><div className="seo-hero__copy"><p className="seo-eyebrow">{t(UI.local)}</p><h1>{t(UI.locationsTitle)}</h1><p>{t(UI.locationsIntro)}</p></div><div className="seo-hero__media"><img src="/storefront-3-locations.png" alt="Tires SOS Rescue locations" /><span>3 Shops · 2 Cities</span></div></header><section className="seo-card-grid seo-card-grid--locations">{locations.map(({ slug, page, loc }, index) => <article className="seo-card seo-card--location" key={slug}><div className="seo-card__number">0{index + 1}</div><div className="seo-card__body"><h2><Link href={`/locations/${slug}`}>{lang === "es" ? page.labelEs : page.label}</Link></h2><p>{loc.full}</p>{loc.phone && <p className="seo-card__phone">{loc.phone}</p>}<Link className="seo-text-link" href={`/locations/${slug}`}>{t(UI.hoursDirections)} →</Link></div></article>)}</section></div></main>;
}

export function LocationLandingView({ page, loc }) {
  const { lang, t } = useCopy(); const label = lang === "es" ? page.labelEs : page.label;
  const city = loc.city?.replace(", CA", "") || loc.line2.split(",")[0];
  const visitTail = lang === "es" ? `para un servicio amable de llantas y auto. Atendemos a conductores de ${city} en inglés y español.` : `for friendly tire and auto care. Our team serves ${city} drivers in English and Spanish.`;
  return <main className="seo-page"><div className="seo-page__inner"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">{t(UI.home)}</Link><span>/</span><Link href="/locations">{t(UI.locations)}</Link><span>/</span><span>{label}</span></nav><header className="seo-hero"><p className="seo-eyebrow">Tires SOS Rescue</p><h1>{lang === "es" ? page.titleEs : page.title}</h1><p>{t(UI.visit)} <strong>{loc.full}</strong> {visitTail}</p><div className="seo-actions"><a className="btn btn--primary" href={loc.mapsHref} target="_blank" rel="noopener noreferrer">{t(UI.directions)}</a><a className="btn btn--ghost" href={SITE.whatsappHref} target="_blank" rel="noopener noreferrer">{t(UI.whatsapp)}</a></div></header><section className="seo-split"><div><h2>{t(UI.servicesHere)}</h2><ul className="seo-link-list">{Object.entries(SERVICE_PAGES).map(([key, value]) => <li key={key}><Link href={`/services/${key}`}>{localizedService(key, value, lang).name}</Link></li>)}</ul></div><aside><h2>{t(UI.shopHours)}</h2><dl className="seo-hours">{SITE.hours.map((h) => <div key={h.day}><dt>{h.label[lang]}</dt><dd>{h.open ? `${h.open}–${h.close}` : lang === "es" ? "Cerrado" : "Closed"}</dd></div>)}</dl></aside></section><section className="seo-map"><h2>{t(UI.find)} {label}</h2><iframe title={`Map to ${SITE.name} at ${loc.full}`} src={loc.mapsEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section></div></main>;
}
