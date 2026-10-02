"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

interface InsightCard {
  title: string;
  total: string | number;
  rows: Record<string, unknown>;
}

// Counts for keywords, articles, and AI usage in one project.
export function InsightsPanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (cancelled) return;
      if (data.success) setProject(data.project);
      else setMissing(true);
    }

    async function loadInsights() {
      try {
        const res = await fetch(`/api/projects/${projectId}/insights`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setData(data.insights);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProject();
    loadInsights();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (missing) {
    return <p className="text-sm text-slate-600">Project not found.</p>;
  }

  if (!project || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data?.keywords || !data?.articles || !data?.ai) {
    return <p className="mt-6 text-sm text-slate-600">Could not load insights.</p>;
  }

  const cards: InsightCard[] = [
    { title: "Keywords", total: data.keywords.total, rows: data.keywords.byStatus || {} },
    {
      title: "Articles",
      total: data.articles.total,
      rows: { ...(data.articles.byStatus || {}), words: data.articles.words },
    },
    {
      title: "AI usage",
      total: `${data.ai.runs} runs`,
      rows: {
        ...(data.ai.byStatus || {}),
        credits: data.ai.creditsUsed,
        cost_usd: Number(data.ai.costUsd || 0).toFixed(4),
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-600">{project.websiteUrl}</p>
        </div>
        <Link href={`/projects/${projectId}`} className="text-sm font-medium text-blue-600 hover:underline">
          Back to project
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{c.title}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.total}</p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              {Object.entries(c.rows).map(([k, v]) => (
                <p key={k} className="flex justify-between">
                  <span className="capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-slate-800">{String(v)}</span>
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}