import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-url";

// Served at /sitemap.xml — the list of public, indexable pages for search engines.
// Excludes noindex pages (e.g. /login, /register) and private/auth routes.

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: "weekly" | "monthly"
  ): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    entry("/", 1.0, "weekly"),
    entry("/features", 0.9, "weekly"),
    entry("/features/keyword-research", 0.8, "monthly"),
    entry("/features/meta-schema", 0.8, "monthly"),
    entry("/features/internal-linking", 0.8, "monthly"),
    entry("/features/word-export", 0.8, "monthly"),
    entry("/features/brand-voice", 0.8, "monthly"),
    entry("/features/ai-article-generator", 0.8, "monthly"),
    entry("/blog", 0.7, "weekly"),
    entry("/blog/what-one-credit-includes", 0.6, "monthly"),
    entry("/blog/review-your-first-article", 0.6, "monthly"),
    entry("/pricing", 0.8, "monthly"),
    entry("/about", 0.5, "monthly"),
    entry("/contact", 0.5, "monthly"),
    entry("/support", 0.5, "monthly"),
    // Legal & compliance pages (indexable public trust pages)
    entry("/terms", 0.3, "monthly"),
    entry("/privacy", 0.3, "monthly"),
    entry("/refunds", 0.3, "monthly"),
  ];
}
