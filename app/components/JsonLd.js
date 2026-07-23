import { SITE } from "../site.config";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function locationSchema(loc) {
  return {
    "@type": ["TireShop", "AutoRepair"],
    "@id": `${SITE.url}/#location-${loc.id}`,
    name: SITE.name,
    url: `${SITE.url}/#location`,
    telephone: "+1-408-332-8962",
    priceRange: "$$",
    image: `${SITE.url}/og.png`,
    branchOf: {
      "@id": `${SITE.url}/#organization`,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.line1,
      addressLocality: "San José",
      addressRegion: "CA",
      postalCode: loc.postalCode,
      addressCountry: "US",
    },
    hasMap: loc.mapsHref,
    areaServed: {
      "@type": "City",
      name: "San Jose",
      sameAs: "https://en.wikipedia.org/wiki/San_Jose,_California",
    },
    openingHoursSpecification: SITE.hours
      .filter((h) => h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_NAMES[h.day],
        opens: h.open,
        closes: h.close,
      })),
    sameAs: [SITE.social.instagram, SITE.social.tiktok, SITE.social.facebook],
    knowsLanguage: ["en", "es"],
    paymentAccepted: "Cash, Credit Card, Afterpay",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Tire and auto services",
      itemListElement: [
        "New tires",
        "Flat tire repair",
        "Wheel alignment",
        "Brake service",
        "Oil changes",
        "Batteries",
        "Rims",
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name,
          areaServed: "San Jose, CA",
        },
      })),
    },
  };
}

// schema.org LocalBusiness markup so Google can surface name, hours,
// phone and address in local search results and the map pack.
export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        description:
          "Tire specialists in San José, CA: new tires, flat repair, wheel alignment, brakes, oil changes, batteries and rims. Bilingual English/Spanish service.",
        logo: `${SITE.url}/logo-mark.png`,
        sameAs: [SITE.social.instagram, SITE.social.tiktok, SITE.social.facebook],
        knowsLanguage: ["en", "es"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: ["en-US", "es-US"],
        publisher: {
          "@id": `${SITE.url}/#organization`,
        },
      },
      ...SITE.locations.map(locationSchema),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
