import type { MetadataRoute } from "next";

const SITE_URL = "https://hourstomax.davidcjw.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The hiscores proxy isn't a page; keep it out of the index.
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
