"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

const usdToInr = (usd: string | number | null) => (Number(usd || 0) * 83).toFixed(2);

export default function AdminArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/content/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load article.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  async function runAction(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, id: Number(id) }),
      });
      const d = await res.json();
      if (!d.success) return;
      if (d.deleted) {
        router.push("/admin/content");
        return;
      }
      setData((prev: any) =>
        prev ? { ...prev, article: { ...prev.article, flagged: d.flagged } } : prev
      );
    } catch {
      // Keep old data; admin can retry.
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

  const a = data.article;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" /> All content
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{a.title || a.h1 || `Article #${a.id}`}</h1>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
          {a.status}
        </span>
        {a.flagged && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
            Flagged
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Keyword: {data.keyword ? data.keyword.keyword : "-"} · {data.user ? data.user.email : "-"} ·{" "}
        {a.wordCount || 0} words · Quality {a.qualityScore ?? "-"}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => runAction({ action: "flag", flagged: !a.flagged })}
          disabled={busy}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {a.flagged ? "Unflag" : "Flag"}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Remove "${a.title || `Article #${a.id}`}"? This cannot be undone.`)) {
              runAction({ action: "remove" });
            }
          }}
          disabled={busy}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Article body</h2>
        {a.bodyHtml ? (
          <div
            className="mt-3 text-sm leading-relaxed text-slate-800 [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: a.bodyHtml }}
          />
        ) : (
          <p className="mt-3 text-sm text-slate-500">No body saved for this article.</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">SEO meta</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2"><dt className="shrink-0 text-slate-500">Meta title</dt><dd className="text-right font-medium text-slate-900">{a.metaTitle || "-"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="shrink-0 text-slate-500">Slug</dt><dd className="text-right font-medium text-slate-900">{a.slug || "-"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="shrink-0 text-slate-500">Readability</dt><dd className="font-medium text-slate-900">{a.readabilityScore ?? "-"}</dd></div>
            <div className="flex justify-between gap-2"><dt className="shrink-0 text-slate-500">Density</dt><dd className="font-medium text-slate-900">{a.keywordDensity ?? "-"}</dd></div>
          </dl>
          {a.metaDescription && <p className="mt-3 text-sm text-slate-600">{a.metaDescription}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Generation trail</h2>
          {data.generations.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No generation record linked.</p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              {data.generations.map((g: any) => (
                <div key={g.id} className="border-b border-slate-100 pb-2">
                  <p className="font-medium text-slate-800">
                    #{g.id} {g.modelName || "AI"} · {g.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(g.tokensIn || 0) + (g.tokensOut || 0)} tokens · Rs.{usdToInr(g.apiCostUsd)} ·{" "}
                    {((g.durationMs || 0) / 1000).toFixed(1)}s · {g.creditsUsed} credits
                  </p>
                  {g.errorMessage && <p className="text-xs text-red-600">{g.errorMessage}</p>}
                  {g.stageTimings && Object.keys(g.stageTimings).length > 0 && (
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-600">
                      {JSON.stringify(g.stageTimings, null, 1)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Version history ({data.versions.length})</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          {data.versions.length === 0 && <p className="text-slate-500">No saved versions.</p>}
          {data.versions.map((v: any) => (
            <div key={v.id} className="flex justify-between gap-2 border-b border-slate-100 py-1.5">
              <span className="text-slate-800">v{v.version}{v.note ? ` — ${v.note}` : ""}</span>
              <span className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}