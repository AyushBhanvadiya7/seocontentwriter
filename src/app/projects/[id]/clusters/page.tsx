import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClustersPanel } from "@/components/project/ClustersPanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Keyword clusters",
    description:
      "See this project's keywords grouped by search intent, so related topics sit together before you write.",
    alternates: { canonical: `/projects/${id}/clusters` },
  };
}

export default async function ProjectClustersPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
      <ProjectTabs projectId={projectId} />
      <ClustersPanel projectId={projectId} />
    </div>
  );
}
