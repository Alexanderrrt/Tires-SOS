import { SERVICE_PAGES, SITE } from "./site.config";

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
    ...Object.keys(SERVICE_PAGES).map((slug) => ({
      url: `${SITE.url}/services/${slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    })),
  ];
}
