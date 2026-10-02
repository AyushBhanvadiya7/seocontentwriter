import type { Metadata } from "next";
import { ArticleEditor } from "@/components/content/ArticleEditor";

// Edit route. The old /contents/[id] page is not changed.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Edit article",
    description: "Change the title, meta tags and article text, then save. This does not publish the page.",
    alternates: { canonical: `/contents/${id}/edit` },
  };
}

export default function EditArticlePage() {
  return <ArticleEditor />;
}
