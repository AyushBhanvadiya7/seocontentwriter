import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { InsightsPanel } from "@/components/project/InsightsPanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Project insights",
    description:
      "See keyword counts, article counts, and AI usage for this project in one place.",
    alternates: { canonical: `/projects/${id}/insights` },
  };
}

export default async function ProjectInsightsPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
       <ProjectTabs projectId={projectId} />
      <InsightsPanel projectId={projectId} />
    </div>
  );
}
