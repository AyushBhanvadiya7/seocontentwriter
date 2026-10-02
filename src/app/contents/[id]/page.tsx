"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleTabs } from "@/components/content/ArticleTabs";
import { Loader2, CheckCircle, AlertCircle, Copy, Download, FileText, Image as ImageIcon, Pencil, RefreshCw, Trash2 } from "lucide-react";

export default function ContentResultPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = parseInt(params.id as string, 10);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"preview" | "html" | "markdown">("preview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", metaTitle: "", metaDescription: "", bodyMarkdown: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenProgress, setRegenProgress] = useState(0);
  const [regenLabel, setRegenLabel] = useState("");
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contents/${contentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setContent(data.content);
        setLoading(false);
      });
  }, [contentId]);

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function downloadFile(text: string, filename: string, type: string) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Downloads the Word file. On failure shows the real server message
  // instead of navigating to a raw error page.
  async function downloadDocx() {
    if (downloadingDocx) return;
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
      a.download = `${content.slug || "article"}.docx`;
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

  async function setStatus(status: string) {
    if (statusBusy || status === content.status) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setContent(data.content);
    } finally {
      setStatusBusy(false);
    }
  }

  async function deleteArticle() {
    if (deleting) return;
    if (!window.confirm("Delete this article forever? Downloads and versions go too.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contents/${contentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) router.push("/library");
    } finally {
      setDeleting(false);
    }
  }

  // Makes a fresh version (1 credit) and opens it in a new tab.
  async function regenerate() {
    if (regenLoading) return;
    if (!window.confirm("Make a fresh version of this article? It costs 1 credit.")) return;
    setRegenLoading(true);
    setRegenError(null);
    setRegenProgress(0);
    setRegenLabel("Starting...");
    try {
      const res = await fetch(`/api/projects/${content.projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId: content.keywordId || content.keyword?.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not start.");
      const generationId = data.generationId;
      for (let i = 0; i < 40; i++) {
        const stepRes = await fetch(`/api/generations/${generationId}/step`, { method: "POST" });
        const step = await stepRes.json();
        if (!step.success) throw new Error(step.message || "Stage failed.");
        setRegenProgress(step.progress ?? 0);
        setRegenLabel(step.stageLabel || step.stage || "");
        if (step.done) {
          if (step.contentId) window.open(`/contents/${step.contentId}`, "_blank");
          break;
        }
      }
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRegenLoading(false);
    }
  }

  function startEdit() {
    setDraft({
      title: content.title || "",
      metaTitle: content.metaTitle || "",
      metaDescription: content.metaDescription || "",
      bodyMarkdown: content.bodyMarkdown || "",
    });
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (saving) return;
    if (!window.confirm("Discard your changes?")) return;
    setEditing(false);
    setSaveError(null);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!data.success) {
        setSaveError(data.message || "Save failed.");
        return;
      }
      setContent(data.content);
      setEditing(false);
    } catch {
      setSaveError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600">Content not found.</p>
      </div>
    );
  }

  const statusColor =
    content.status === "published"
      ? "bg-green-100 text-green-700"
      : content.status === "approved"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-600";
  const report = content.validationReport || {};
    const rules = report.report || report.checks || [];
  const draftWords = draft.bodyMarkdown.split(/\s+/).filter(Boolean).length;

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
      <ArticleTabs contentId={contentId} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{content.title || content.h1 || "Untitled"}</h1>
          <p className="text-sm text-slate-600">
            Keyword: {content.keyword?.keyword} · {content.wordCount} words · Score: {content.qualityScore}/100 ·{" "}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>{content.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
          <button
            onClick={() => copyText(content.bodyHtml)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" /> Copy HTML
          </button>
          <button
            onClick={() => downloadFile(content.bodyMarkdown, `${content.slug || "article"}.md`, "text/markdown")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> .md
          </button>
          <button
            onClick={() => downloadFile(content.bodyHtml, `${content.slug || "article"}.html`, "text/html")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> .html
          </button>
          <button
            onClick={() => downloadFile(JSON.stringify(content, null, 2), `${content.slug || "article"}.json`, "application/json")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> .json
          </button>
          <button
            onClick={downloadDocx}
            disabled={downloadingDocx}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {downloadingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{" "}
            {downloadingDocx ? "Downloading..." : ".docx"}
          </button>
          <select
            value={content.status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={statusBusy}
            aria-label="Article status"
            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>
          <button
            onClick={regenerate}
            disabled={regenLoading}
            title="Make a fresh version (1 credit)"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {regenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{" "}
            {regenLoading ? "Working..." : "Regenerate"}
          </button>
          <button
            onClick={deleteArticle}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {docxError && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{docxError}</p>
      )}

      {regenLoading && (
        <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">{regenLabel || "Working..."}</span>
            <span className="text-blue-700">{regenProgress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${regenProgress}%` }}
            />
          </div>
        </div>
      )}
      {regenError && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{regenError}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {editing ? (
            <div className="space-y-4">
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
                  Article text (Markdown) <span className="font-normal text-slate-500">({draftWords} words)</span>
                </label>
                <textarea
                  value={draft.bodyMarkdown}
                  onChange={(e) => setDraft({ ...draft, bodyMarkdown: e.target.value })}
                  rows={20}
                  className={`${inputClass} font-mono text-xs leading-relaxed`}
                />
              </div>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex gap-2 border-b border-slate-200 pb-2">
                {(["preview", "html", "markdown"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                      activeTab === t ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {activeTab === "preview" && (
                <article
                  className="prose-content"
                  dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
                />
              )}
              {activeTab === "html" && (
                <pre className="max-h-[600px] overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
                  {content.bodyHtml}
                </pre>
              )}
              {activeTab === "markdown" && (
                <pre className="max-h-[600px] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
                  {content.bodyMarkdown}
                </pre>
              )}
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">SEO panel</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Meta title</dt>
                <dd className="font-medium text-slate-900">{content.metaTitle || "-"}</dd>
                <dd className="text-xs text-slate-500">{content.metaTitle?.length || 0} chars</dd>
              </div>
              <div>
                <dt className="text-slate-500">Meta description</dt>
                <dd className="font-medium text-slate-900">{content.metaDescription || "-"}</dd>
                <dd className="text-xs text-slate-500">{content.metaDescription?.length || 0} chars</dd>
              </div>
              <div>
                <dt className="text-slate-500">Slug</dt>
                <dd className="font-medium text-slate-900">{content.slug || "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Readability</dt>
                <dd className="font-medium text-slate-900">Flesch {content.readabilityScore?.toFixed(0) || "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Keyword density</dt>
                <dd className="font-medium text-slate-900">{content.keywordDensity?.toFixed(2) || "-"}%</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Validation</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {rules.map((rule: any, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  {rule.status === "pass" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-slate-700">
                    {rule.rule}: <span className="font-medium">{rule.value}</span>
                  </span>
                </li>
              ))}
              {rules.length === 0 && <li className="text-slate-500">No validation report yet.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Links</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Internal</p>
                {(content.internalLinks || []).length === 0 ? (
                  <p className="text-slate-500">No internal links. Add pages in the Links tab.</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {content.internalLinks.map((link: any, i: number) => (
                      <li key={i}>
                        <a href={link.url} className="text-blue-600 hover:underline">{link.anchor}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">External</p>
                <ul className="mt-1 space-y-1">
                  {(content.externalLinks || []).map((link: any, i: number) => (
                    <li key={i}>
                      <a href={link.url} className="text-blue-600 hover:underline">{link.anchor}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Image prompts</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(content.imagePrompts || []).map((img: any, i: number) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-slate-500 uppercase">{img.for_section}</p>
              </div>
              <p className="mt-2 text-sm text-slate-800">{img.prompt}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p><span className="font-medium">Alt:</span> {img.alt_text}</p>
                <p><span className="font-medium">File:</span> {img.file_name}</p>
              </div>
              <button
                onClick={() => copyText(img.prompt)}
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                <Copy className="h-3 w-3" /> Copy prompt
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}