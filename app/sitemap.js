import { SITE } from "./site.config";

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
  ];
}
