import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

// Served at /robots.txt — tells search engines what they may and may not crawl.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/billing",
          "/contents/",
          "/library",
          "/projects/",
          "/settings",
          "/forgot-password",
          "/reset-password",
          "/verify",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
