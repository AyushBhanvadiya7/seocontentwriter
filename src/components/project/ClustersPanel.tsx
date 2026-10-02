"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Keyword {
  id: number;
  keyword: string;
  intent?: string;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

// Groups one project's keywords by search intent.
export function ClustersPanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
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

    async function loadKeywords() {
      const res = await fetch(`/api/projects/${projectId}/keywords?limit=200`);
      const data = await res.json();
      if (cancelled) return;
      if (data.success) setKeywords(data.keywords);
      setLoading(false);
    }

    loadProject();
    loadKeywords();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const groups = useMemo(() => {
    const map = new Map<string, Keyword[]>();
    for (const k of keywords) {
      const name = (k.intent || "ungrouped").toLowerCase();
      const list = map.get(name) ?? [];
      list.push(k);
      map.set(name, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [keywords]);

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

      {keywords.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Add keywords first — clusters form automatically from intent.</p>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Auto-groups by search intent. {groups.length} cluster(s) from {keywords.length} keyword(s).
          </p>
          {groups.map(([name, list]) => (
            <div key={name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium capitalize text-slate-900">{name}</p>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {list.length}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {list.slice(0, 12).map((k) => (
                  <span key={k.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {k.keyword}
                  </span>
                ))}
                {list.length > 12 && (
                  <span className="px-2 py-1 text-xs text-slate-500">+{list.length - 12} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}