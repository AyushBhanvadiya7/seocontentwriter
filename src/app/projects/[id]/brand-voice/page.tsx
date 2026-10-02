import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BrandVoicePanel } from "@/components/project/BrandVoicePanel";
import { ProjectTabs } from "@/components/project/ProjectTabs";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Brand voice",
    description:
      "Set the tone, author, banned words, and a writing sample for this project. New articles follow this voice.",
    alternates: { canonical: `/projects/${id}/brand-voice` },
  };
}

export default async function ProjectBrandVoicePage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isFinite(projectId)) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
       <ProjectTabs projectId={projectId} />
      <BrandVoicePanel projectId={projectId} />
    </div>
  );
}
