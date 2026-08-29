import { SITE } from "./site.config";
import { LOCATION_PAGES, SERVICE_PAGES } from "./seo-content";

export default function sitemap() {
  return [
    {
      url: SITE.url,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE.url}/quote`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${SITE.url}/services`, changeFrequency: "monthly", priority: 0.9 },
    ...Object.keys(SERVICE_PAGES).map((slug) => ({
      url: `${SITE.url}/services/${slug}`,
      changeFrequency: "monthly",
      priority: 0.85,
    })),
    { url: `${SITE.url}/locations`, changeFrequency: "monthly", priority: 0.9 },
    ...Object.keys(LOCATION_PAGES).map((slug) => ({
      url: `${SITE.url}/locations/${slug}`,
      changeFrequency: "monthly",
      priority: 0.85,
    })),
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
