"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AdminContentPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load content.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/content");
      const d = await res.json();
      if (d.success) setData(d);
    } catch {
      // Keep old data when a background refresh fails.
    }
  }

  async function runAction(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) await refresh();
    } catch {
      // Page keeps old data; admin can retry.
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-slate-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Content</h1>
      <p className="text-sm text-slate-600">
        {data.articles.length} articles · {data.projects.length} projects
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Words</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.articles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  No articles yet. They appear here after users generate content.
                </td>
              </tr>
            )}
            {data.articles.map((a: any) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/content/${a.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {a.title || a.h1 || `Article #${a.id}`}
                  </Link>
                  <p className="text-xs text-slate-500">{a.keyword}</p>
                  {a.flagged && (
                    <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Flagged
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">{a.user ? a.user.email : "-"}</td>
                <td className="px-4 py-3">{a.wordCount || 0}</td>
                <td className="px-4 py-3">{a.qualityScore ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => runAction({ action: "flag", id: a.id, flagged: !a.flagged })}
                      disabled={busy}
                      className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {a.flagged ? "Unflag" : "Flag"}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove "${a.title || `Article #${a.id}`}"? This cannot be undone.`)) {
                          runAction({ action: "remove", id: a.id });
                        }
                      }}
                      disabled={busy}
                      className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Projects ({data.projects.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No projects yet.
                  </td>
                </tr>
              )}
              {data.projects.map((p: any) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500">{p.websiteUrl}</td>
                  <td className="px-4 py-3 text-xs">{p.user ? p.user.email : "-"}</td>
                  <td className="px-4 py-3 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}