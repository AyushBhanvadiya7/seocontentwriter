import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { KeywordsPanel } from "@/components/project/KeywordsPanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Project keywords",
    description:
      "Upload a keyword file, paste a list, filter by status, and turn the rows you pick into researched SEO articles. One credit per article.",
    alternates: { canonical: `/projects/${id}/keywords` },
  };
}

export default async function ProjectKeywordsPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
      <ProjectTabs projectId={projectId} />
      <KeywordsPanel projectId={projectId} />
    </div>
  );
}
