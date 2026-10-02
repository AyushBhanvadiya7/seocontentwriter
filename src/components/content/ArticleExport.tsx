"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, Download, FileText, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleTabs } from "@/components/content/ArticleTabs";

function downloadFile(text: string, filename: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Export view for one article. No editing here. Word uses the existing API.
export function ArticleExport() {
  const params = useParams();
  const contentId = parseInt(String(params.id || ""), 10);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        setArticle(data.content);
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

  async function downloadDocx() {
    if (downloadingDocx || !article) return;
    setDownloadingDocx(true);
    setDocxError(null);
    try {
      const res = await fetch(`/api/contents/${contentId}/export?format=docx`);
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok || !contentType.includes("officedocument")) {
        const data = await res.json().catch(() => ({} as { message?: string }));
        throw new Error(data.message || "Download failed. Please try again.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${article.slug || "article"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDocxError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setDownloadingDocx(false);
    }
  }

  function copyHtml() {
    if (!article?.bodyHtml) return;
    navigator.clipboard.writeText(article.bodyHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-12 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading export options
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-slate-700">{error || "Article not found."}</p>
        <Link href="/library" className="mt-4 inline-block text-sm font-medium text-blue-600">
          Back to library
        </Link>
      </div>
    );
  }

  const slug = article.slug || "article";
  const wordCount = article.wordCount || article.bodyMarkdown?.split(/\s+/).filter(Boolean).length || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs />
      <ArticleTabs contentId={contentId} />
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Export</h1>
      <p className="mt-1 text-sm text-slate-600">
        Download this draft for Word, your site, or backup. {wordCount} words. Publishing is separate.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Downloads</h2>
        <p className="mt-1 text-sm text-slate-600">
          Word uses the server file. HTML and Markdown download directly in the browser.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={downloadDocx}
            disabled={downloadingDocx}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {downloadingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloadingDocx ? "Building Word..." : "Download .docx"}
          </button>
          <button
            onClick={() => downloadFile(article.bodyHtml || "", `${slug}.html`, "text/html")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> .html
          </button>
          <button
            onClick={() => downloadFile(article.bodyMarkdown || "", `${slug}.md`, "text/markdown")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> .md
          </button>
          <button
            onClick={() => downloadFile(JSON.stringify(article, null, 2), `${slug}.json`, "application/json")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> .json
          </button>
        </div>
        {docxError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{docxError}</p>}
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Quick copy</h2>
        <p className="mt-1 text-sm text-slate-600">Copy the HTML if you paste into WordPress or another editor.</p>
        <button
          onClick={copyHtml}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy HTML"}
        </button>
        <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
          {(article.bodyHtml || "").slice(0, 4000)}
          {(article.bodyHtml || "").length > 4000 ? "\n... cut for preview. Use Download .html for the full file." : ""}
        </pre>
      </section>
    </div>
  );
}