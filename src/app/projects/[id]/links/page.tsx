import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LinksPanel } from "@/components/project/LinksPanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Project page links",
    description:
      "Add your existing site pages by URL or sitemap. New articles can link to them wherever the words appear.",
    alternates: { canonical: `/projects/${id}/links` },
  };
}

export default async function ProjectLinksPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
       <ProjectTabs projectId={projectId} />
      <LinksPanel projectId={projectId} />
    </div>
  );
}
