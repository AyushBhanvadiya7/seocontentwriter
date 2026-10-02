"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleTabs } from "@/components/content/ArticleTabs";

type Draft = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  bodyMarkdown: string;
};

// Editor for one article. The old article page stays as it is.
export function ArticleEditor() {
  const params = useParams();
  const contentId = parseInt(String(params.id || ""), 10);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!Number.isFinite(contentId)) {
        setError("This article link is not valid.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/contents/${contentId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.success) {
          setError(data.message || "Article not found.");
          return;
        }
        const article = data.content;
        setDraft({
          title: article.title || "",
          metaTitle: article.metaTitle || "",
          metaDescription: article.metaDescription || "",
          bodyMarkdown: article.bodyMarkdown || "",
        });
      } catch {
        if (!cancelled) setError("Could not load the article.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Save failed.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-12 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading article
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-slate-700">{error || "Article not found."}</p>
        <Link href="/library" className="mt-4 inline-block text-sm font-medium text-blue-600">
          Back to library
        </Link>
      </div>
    );
  }

  const words = draft.bodyMarkdown.split(/\s+/).filter(Boolean).length;
  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs />
      <ArticleTabs contentId={contentId} />
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Edit article</h1>
      <p className="mt-1 text-sm text-slate-600">
        Change the title, meta tags or text, then save. This does not publish the page.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Meta title <span className="font-normal text-slate-500">({draft.metaTitle.length} chars)</span>
          </label>
          <input
            value={draft.metaTitle}
            onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Meta description <span className="font-normal text-slate-500">({draft.metaDescription.length} chars)</span>
          </label>
          <textarea
            value={draft.metaDescription}
            onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Article text <span className="font-normal text-slate-500">({words} words)</span>
          </label>
          <textarea
            value={draft.bodyMarkdown}
            onChange={(e) => setDraft({ ...draft, bodyMarkdown: e.target.value })}
            rows={18}
            className={`${inputClass} font-mono text-xs leading-relaxed`}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">Saved. The article page now uses this text.</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}