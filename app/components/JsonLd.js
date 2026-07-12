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
    name: SITE.name,
    url: SITE.url,
    telephone: "+1-408-332-8962",
    priceRange: "$$",
    image: `${SITE.url}/og.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.line1,
      addressLocality: "San José",
      addressRegion: "CA",
      postalCode: loc.postalCode,
      addressCountry: "US",
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
        name: SITE.name,
        url: SITE.url,
        description:
          "Tire specialists in San José, CA: new tires, flat repair, wheel alignment, brakes, oil changes, batteries and rims. Bilingual English/Spanish service.",
        logo: `${SITE.url}/logo-mark.png`,
        sameAs: [SITE.social.instagram, SITE.social.tiktok, SITE.social.facebook],
        knowsLanguage: ["en", "es"],
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
