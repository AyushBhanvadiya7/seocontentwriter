import type { Metadata } from "next";
import { ArticleExport } from "@/components/content/ArticleExport";

// Export route. The old /contents/[id] page is not changed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Export article",
    description: "Download this article as Word, HTML, Markdown or JSON. No publishing from here.",
    alternates: { canonical: `/contents/${id}/export` },
  };
}

export default function ArticleExportPage() {
  return <ArticleExport />;
}
