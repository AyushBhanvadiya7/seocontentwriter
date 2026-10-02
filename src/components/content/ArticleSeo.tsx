"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleTabs } from "@/components/content/ArticleTabs";

type LinkItem = { url?: string; anchor?: string };
type Rule = { status?: string; rule?: string; value?: string };

// SEO view for one article. Read only. Editing stays on /edit.
export function ArticleSeo() {
  const params = useParams();
  const contentId = parseInt(String(params.id || ""), 10);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-12 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading SEO details
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

  const report = article.validationReport || {};
  const rules: Rule[] = report.report || report.checks || [];
  const internal: LinkItem[] = article.internalLinks || [];
  const external: LinkItem[] = article.externalLinks || [];

  const humanScore: number | null = report.humanScore ?? (report.humanReport?.score ?? null);
  const humanReport = report.humanReport || {};
  const archetype = report.archetype || null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs />
      <ArticleTabs contentId={contentId} />
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">SEO details</h1>
      <p className="mt-1 text-sm text-slate-600">
        Meta tags, human-feel quality score, and links for this article draft.
      </p>

      {/* Human-Feel Score Card (Part 1.C) */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">Human-Feel Quality Score</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Evaluates robotic clichés, natural contractions, rhythm burstiness, and lived experience cues.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {humanScore !== null ? (
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-semibold text-lg ${
                  humanScore >= 75
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : humanScore >= 60
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <span>{humanScore} / 100</span>
                <span className="text-xs font-normal">
                  {humanScore >= 75 ? "Natural Voice" : humanScore >= 60 ? "Acceptable" : "Robotic Warning"}
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-500">Not scored yet</span>
            )}
          </div>
        </div>

        {humanScore !== null && humanScore < 70 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              <strong>Low Human-Feel Warning:</strong> This draft has some machine-like cadence or robotic phrasing. We recommend reviewing sentence lengths and replacing formal uncontracted phrasing.
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-xs text-slate-500">Banned AI Clichés</span>
            <p className="mt-1 font-semibold text-slate-900">
              {humanReport.bannedCount ?? 0} found
            </p>
            <p className="text-[11px] text-slate-500">
              {humanReport.bannedCount === 0 ? "100% clean" : "Should be 0"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-xs text-slate-500">Natural Contractions</span>
            <p className="mt-1 font-semibold text-slate-900">
              {humanReport.contractionsCount ?? "-"} used
            </p>
            <p className="text-[11px] text-slate-500">don&apos;t, we&apos;re, it&apos;s</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-xs text-slate-500">Sentence Burstiness</span>
            <p className="mt-1 font-semibold text-slate-900">
              {humanReport.sentenceVariance ? `±${humanReport.sentenceVariance} w` : "-"}
            </p>
            <p className="text-[11px] text-slate-500">Short/long rhythm mix</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <span className="text-xs text-slate-500">Em-Dash Count</span>
            <p className="mt-1 font-semibold text-slate-900">
              {humanReport.emDashCount ?? 0} / 2 max
            </p>
            <p className="text-[11px] text-slate-500">Avoids AI formatting tick</p>
          </div>
        </div>

        {archetype && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50/60 px-4 py-2.5 text-xs text-indigo-900 border border-indigo-100">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Outline Archetype:</strong> {archetype.name} — {archetype.description}
            </span>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Meta tags</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Meta title</dt>
            <dd className="break-words font-medium text-slate-900">{article.metaTitle || "-"}</dd>
            <dd className="text-xs text-slate-500">{article.metaTitle?.length || 0} chars. Aim for 30 to 65.</dd>
          </div>
          <div>
            <dt className="text-slate-500">Meta description</dt>
            <dd className="break-words font-medium text-slate-900">{article.metaDescription || "-"}</dd>
            <dd className="text-xs text-slate-500">{article.metaDescription?.length || 0} chars. Aim for 120 to 165.</dd>
          </div>
          <div>
            <dt className="text-slate-500">Slug</dt>
            <dd className="break-words font-medium text-slate-900">{article.slug || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Quality score</dt>
            <dd className="font-medium text-slate-900">{article.qualityScore ?? "-"} / 100</dd>
          </div>
          <div>
            <dt className="text-slate-500">Readability</dt>
            <dd className="font-medium text-slate-900">
              Flesch {article.readabilityScore?.toFixed(0) || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Keyword density</dt>
            <dd className="font-medium text-slate-900">
              {article.keywordDensity?.toFixed(2) || "-"}%. Aim for 0.4 to 2.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Checks</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rules.map((rule, i) => (
            <li key={`${rule.rule || "rule"}-${i}`} className="flex items-start gap-2">
              {rule.status === "pass" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className="text-slate-700">
                {rule.rule || "Check"}: <span className="font-medium">{rule.value || "-"}</span>
              </span>
            </li>
          ))}
          {rules.length === 0 && <li className="text-slate-500">No validation report yet.</li>}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Links</h2>
        <div className="mt-3 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Internal</p>
            {internal.length === 0 ? (
              <p className="mt-1 text-slate-500">No internal links yet. Add pages on the project Links tab.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {internal.map((link, i) => (
                  <li key={`in-${i}`}>
                    <a href={link.url || "#"} className="break-all text-blue-600 hover:underline">
                      {link.anchor || link.url || "Link"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">External</p>
            {external.length === 0 ? (
              <p className="mt-1 text-slate-500">No external links yet.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {external.map((link, i) => (
                  <li key={`ex-${i}`}>
                    <a
                      href={link.url || "#"}
                      className="break-all text-blue-600 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.anchor || link.url || "Link"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
