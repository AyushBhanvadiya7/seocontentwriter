"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";

interface ProjectLink {
  id: number;
  url: string;
  slug?: string | null;
  pageTitle?: string | null;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

// Site-page library for one project. Articles link to these pages.
export function LinksPanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasted, setPasted] = useState("");
  const [sitemap, setSitemap] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadProject();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (data.success) setProject(data.project);
    else setMissing(true);
  }

  async function load() {
    try {
      const res = await fetch(`/api/projects/${projectId}/links`);
      const data = await res.json();
      if (data.success) setLinks(data.links);
    } finally {
      setLoading(false);
    }
  }

  async function importUrls(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ ok: false, text: data.message || "Import failed." });
        return;
      }
      setMsg({ ok: true, text: `Added ${data.added} pages (${data.skipped} skipped as duplicates).` });
      setPasted("");
      load();
    } catch {
      setMsg({ ok: false, text: "Import failed. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(id: number) {
    if (!window.confirm("Remove this page from the library?")) return;
    await fetch(`/api/projects/${projectId}/links?id=${id}`, { method: "DELETE" });
    load();
  }

  async function clearAll() {
    if (!window.confirm("Remove ALL pages from the library?")) return;
    await fetch(`/api/projects/${projectId}/links?all=1`, { method: "DELETE" });
    load();
  }

  if (missing) {
    return <p className="text-sm text-slate-600">Project not found.</p>;
  }

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const sitemapHint = project.websiteUrl
    ? `${project.websiteUrl.replace(/\/+$/, "")}/sitemap.xml`
    : "https://yoursite.com/sitemap.xml";

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

      <div className="mt-6 space-y-6">
        <p className="text-sm text-slate-600">
          Add your site pages here. New articles will link to them automatically wherever the words appear.
        </p>
        {msg && (
          <p className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-900">Paste page URLs</h3>
            <p className="mt-1 text-xs text-slate-500">One URL per line.</p>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={5}
              placeholder={"https://yoursite.com/blog/best-safari\nhttps://yoursite.com/pricing"}
              className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => importUrls({ urls: pasted.split(/[\n,]+/) })}
              disabled={busy || !pasted.trim()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import URLs
            </button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-medium text-slate-900">Import from sitemap</h3>
            <p className="mt-1 text-xs text-slate-500">Easiest way to add all pages at once.</p>
            <input
              value={sitemap}
              onChange={(e) => setSitemap(e.target.value)}
              placeholder={sitemapHint}
              className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => importUrls({ sitemapUrl: sitemap.trim() || sitemapHint })}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import sitemap
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Library ({links.length} pages)</h3>
            {links.length > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-red-600 hover:text-red-700">
                Clear all
              </button>
            )}
          </div>
          {loading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </p>
          ) : links.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pages yet. Import some above to enable internal links.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 text-sm">
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{l.pageTitle || l.slug || l.url}</p>
                    <p className="truncate text-xs text-slate-500">{l.url}</p>
                  </div>
                  <button onClick={() => removeLink(l.id)} className="shrink-0 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}