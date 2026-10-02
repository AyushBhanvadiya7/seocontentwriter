"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface ArticleRow {
  id: number;
  title?: string | null;
  keyword?: string | null;
  wordCount?: number | null;
  status?: string | null;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

// Article list for one project.
export function ContentPanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState<ArticleRow[]>([]);
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

    async function loadArticles() {
      try {
        const res = await fetch(`/api/projects/${projectId}/contents`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) setItems(data.contents);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProject();
    loadArticles();
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

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          No articles yet. Make content from the{" "}
          <Link href={`/projects/${projectId}/keywords`} className="font-medium text-blue-600 hover:underline">
            Keywords page
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Words</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Open</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.title || "(untitled)"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.keyword || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.wordCount ?? 0}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{c.status}</td>
                  <td className="px-4 py-3">
                    <a href={`/contents/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}