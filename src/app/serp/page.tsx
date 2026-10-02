"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Globe,
  Info,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface SerpResult {
  rank: number;
  title: string;
  url: string;
  snippet: string;
}

interface SerpData {
  keyword: string;
  topResults: SerpResult[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
}

const SAMPLE_KEYWORDS = [
  "waterproofing services in surat",
  "terrace leak repair cost",
  "best seo tools for agencies",
  "how to start blogging in 2026",
];

function SerpContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [keyword, setKeyword] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SerpData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const runSearch = useCallback(async (queryToSearch?: string) => {
    const q = (queryToSearch ?? keyword).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    // Update URL query param without full reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("q", q);
      window.history.replaceState({}, "", url.toString());
    }

    try {
      const res = await fetch(`/api/serp?q=${encodeURIComponent(q)}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Failed to fetch SERP data.");
        setData(null);
      } else {
        setData({
          keyword: json.keyword,
          topResults: json.topResults || [],
          peopleAlsoAsk: json.peopleAlsoAsk || [],
          relatedSearches: json.relatedSearches || [],
        });
      }
    } catch {
      setError("Network problem. Please check your connection and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (!initialQuery.trim()) return;
    const timer = setTimeout(() => {
      runSearch(initialQuery);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialQuery, runSearch]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs />

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Globe className="h-3.5 w-3.5" /> Real Google SERP Data
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Live SERP Competitor Research
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect real ranking pages, People Also Ask questions, and related search queries before writing.
            Free lookups · 10 requests / minute.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:self-auto"
        >
          View Projects <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleFormSubmit} className="mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter search term or keyword, e.g. terrace leak repair..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" /> Research SERP
              </>
            )}
          </button>
        </div>

        {/* Sample keyword chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Try:</span>
          {SAMPLE_KEYWORDS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setKeyword(sample);
                runSearch(sample);
              }}
              className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {sample}
            </button>
          ))}
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="mt-1 text-xs text-amber-800">
                To enable live Google SERP scraping, add your free key in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">SERPER_API_KEY</code> in <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env</code>.
                Get 2,500 free queries at <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline font-medium">serper.dev</a>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {/* SERP Results */}
      {data && !loading && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main Column: Top 10 Google Organic Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Top 10 Google Results for &ldquo;{data.keyword}&rdquo;
              </h2>
              <span className="text-xs text-slate-500">
                {data.topResults.length} pages ranking
              </span>
            </div>

            <div className="space-y-3">
              {data.topResults.map((item) => {
                const isCopied = copiedUrl === item.url;
                let domain = "";
                try {
                  domain = new URL(item.url).hostname.replace(/^www\./, "");
                } catch {
                  domain = item.url;
                }

                return (
                  <div
                    key={item.rank}
                    className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            item.rank <= 3
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className="truncate text-xs font-medium text-emerald-700">
                          {domain}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-90">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.url)}
                          title="Copy page URL"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy URL
                            </>
                          )}
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in new tab"
                          className="inline-flex items-center rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-blue-700 hover:underline">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </h3>

                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {item.snippet}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: People Also Ask & Related Searches */}
          <div className="space-y-6">
            {/* Action Box */}
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Sparkles className="h-4 w-4 text-blue-600" /> Ready to write?
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                Turn this keyword into an SEO-optimized, humanized article with meta tags and schema markup.
              </p>
              <Link
                href="/dashboard"
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Go to Projects to Generate <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* People Also Ask */}
            {data.peopleAlsoAsk.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">People Also Ask</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Great questions to include in your article FAQ section.
                </p>

                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {data.peopleAlsoAsk.map((q, idx) => (
                    <li key={idx} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-800">{q}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(q)}
                          title="Copy question"
                          className="shrink-0 text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Searches */}
            {data.relatedSearches.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Related Searches</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Good candidates for secondary keywords and semantic coverage.
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {data.relatedSearches.map((term, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setKeyword(term);
                        runSearch(term);
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SerpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SerpContent />
    </Suspense>
  );
}
