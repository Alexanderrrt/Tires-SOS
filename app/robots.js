import { SITE } from "./site.config";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
