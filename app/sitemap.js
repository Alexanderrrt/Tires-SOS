import { SITE } from "./site.config";

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
  ];
}
