import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContentPanel } from "@/components/project/ContentPanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Project articles",
    description:
      "Open the articles already written for this project. Each row shows the keyword, word count, and status.",
    alternates: { canonical: `/projects/${id}/content` },
  };
}

export default async function ProjectContentPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
       <ProjectTabs projectId={projectId} />
      <ContentPanel projectId={projectId} />
    </div>
  );
}
