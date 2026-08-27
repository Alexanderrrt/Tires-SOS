import { SITE } from "./site.config";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/sign-in/", "/sign-up/"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
