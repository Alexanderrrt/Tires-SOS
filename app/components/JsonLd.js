import { SITE } from "../site.config";
import { getPublicSite } from "../../lib/location-config";

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
  const city = loc.line2?.split(",")[0] || "San Jose";
  const citySlug = city.toLowerCase().includes("hayward")
    ? "Hayward,_California"
    : "San_Jose,_California";
  const hours = loc.hours || SITE.hours;
  return {
    "@type": ["TireShop", "AutoRepair"],
    name: SITE.name,
    url: SITE.url,
    telephone: loc.phone || SITE.phone,
    priceRange: "$$",
    image: `${SITE.url}/og.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: loc.line1,
      addressLocality: city,
      addressRegion: "CA",
      postalCode: loc.postalCode,
      addressCountry: "US",
    },
    hasMap: loc.mapsHref,
    areaServed: {
      "@type": "City",
      name: city,
      sameAs: `https://en.wikipedia.org/wiki/${citySlug}`,
    },
    openingHoursSpecification: hours
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
export default async function JsonLd() {
  const publicSite = await getPublicSite();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        alternateName: SITE.nameShort,
        url: SITE.url,
        description:
          "Tire specialists serving San José and Hayward, CA: new tires, flat repair, wheel alignment, brakes, oil changes, batteries and rims. Bilingual English/Spanish service.",
        logo: {
          "@type": "ImageObject",
          url: `${SITE.url}/logo-mark.png`,
          contentUrl: `${SITE.url}/logo-mark.png`,
          width: 1600,
          height: 840,
        },
        sameAs: [SITE.social.instagram, SITE.social.tiktok, SITE.social.facebook],
        knowsLanguage: ["en", "es"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        alternateName: SITE.nameShort,
        inLanguage: ["en-US", "es-US"],
        publisher: {
          "@id": `${SITE.url}/#organization`,
        },
      },
      ...publicSite.locations.filter((location) => location.status !== "mystery").map(locationSchema),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
