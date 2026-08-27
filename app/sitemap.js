import { SITE } from "./site.config";
import { LOCATION_PAGES, SERVICE_PAGES } from "./seo-content";

export default function sitemap() {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE.url}/quote`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${SITE.url}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...Object.keys(SERVICE_PAGES).map((slug) => ({ url: `${SITE.url}/services/${slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 })),
    { url: `${SITE.url}/locations`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    ...Object.keys(LOCATION_PAGES).map((slug) => ({ url: `${SITE.url}/locations/${slug}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 })),
    {
      url: `${SITE.url}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
