"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Search, Trash2 } from "lucide-react";

export interface LibraryItem {
  id: number;
  title: string | null;
  h1: string | null;
  wordCount: number;
  qualityScore: number | null;
  status: string;
  briefId: number | null;
  keyword: string;
  projectName: string;
}

const STATUSES = ["draft", "approved", "exported", "published"];

export default function LibraryList({ initialItems }: { initialItems: LibraryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const shown = items.filter((item) => {
    if (status && item.status !== status) return false;
    if (!needle) return true;
    return (
      (item.title || "").toLowerCase().includes(needle) ||
      (item.h1 || "").toLowerCase().includes(needle) ||
      item.keyword.toLowerCase().includes(needle)
    );
  });

  async function deleteItem(id: number) {
    if (deletingId !== null) return;
    if (!window.confirm("Delete this article forever? Downloads and versions go too.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/contents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Delete failed.");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Delete failed. Check your connection and try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or keyword..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Showing {shown.length} of {items.length} articles.
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-slate-600">No content yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Generate your first article from a project workspace, or{" "}
            <Link href="/human/new" className="font-medium text-emerald-700 hover:underline">
              write a human article
            </Link>
            .
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-600">No articles match your search.</p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {shown.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/contents/${item.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                  {item.title || item.h1 || "Untitled"}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span>
                    {item.projectName} · {item.keyword} · {item.wordCount} words · Score{" "}
                    {item.qualityScore ?? "-"}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-medium capitalize text-slate-700">
                    {item.status}
                  </span>
                  {item.briefId === null ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                      Human
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                      AI
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/contents/${item.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={deletingId !== null}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}