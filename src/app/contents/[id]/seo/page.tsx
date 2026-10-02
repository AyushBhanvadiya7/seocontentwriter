import type { Metadata } from "next";
import { ArticleSeo } from "@/components/content/ArticleSeo";

// SEO route. The old /contents/[id] page is not changed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Article SEO details",
    description: "Meta title, meta description, quality score and links for this article. Not a Google ranking.",
    alternates: { canonical: `/contents/${id}/seo` },
  };
}

export default function ArticleSeoPage() {
  return <ArticleSeo />;
}
