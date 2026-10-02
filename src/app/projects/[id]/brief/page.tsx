"use client";

import { useState, useEffect, useMemo, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  ArrowRight,
  Search,
  Loader2,
  AlertCircle,
  Sliders,
  CheckCircle,
  HelpCircle,
  Coins,
  Globe,
  Tag,
  Zap,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProjectTabs } from "@/components/project/ProjectTabs";

interface Keyword {
  id: number;
  keyword: string;
  volume?: number | null;
  difficulty?: number | null;
  intent?: string | null;
  status: string;
  cluster?: { id: number; name: string } | null;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
  targetCity?: string | null;
  targetCountry?: string | null;
  language?: string | null;
  industry?: string | null;
}

const CONTENT_TYPES = [
  { value: "blog_post", label: "Blog post", desc: "Standard informative article for organic traffic" },
  { value: "how_to_guide", label: "How-to guide", desc: "Step-by-step tutorial solving a specific problem" },
  { value: "listicle", label: "Listicle", desc: "Curated list of tips, tools, or best practices" },
  { value: "service_page", label: "Service page", desc: "High-intent landing copy tailored to local buyers" },
  { value: "faq_article", label: "FAQ article", desc: "Comprehensive answers to common customer questions" },
  { value: "comparison", label: "Comparison / Review", desc: "Objective comparison between solutions or services" },
];

const TONES = [
  { value: "simple English", label: "Simple English", desc: "Clear, Grade-7 vocabulary without fluff" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational tone" },
  { value: "professional", label: "Professional", desc: "Authoritative and business-oriented" },
  { value: "persuasive", label: "Persuasive", desc: "Oriented towards action and conversions" },
  { value: "expert", label: "Expert", desc: "In-depth, technical insights for informed readers" },
];

function BriefForm({ projectId }: { projectId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordIdParam = searchParams.get("keywordId");

  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(
    keywordIdParam ? parseInt(keywordIdParam, 10) : null
  );
  const [customTitle, setCustomTitle] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [targetWords, setTargetWords] = useState(1200);
  const [tone, setTone] = useState("simple English");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [secondaryText, setSecondaryText] = useState("");
  const [mode, setMode] = useState<"ai" | "humanized">("ai");

  // Load project & keywords
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [projRes, kwRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/keywords`),
        ]);

        const projData = await projRes.json();
        const kwData = await kwRes.json();

        if (cancelled) return;

        if (projData.success) {
          setProject(projData.project);
        }

        if (kwData.success && Array.isArray(kwData.keywords)) {
          setKeywords(kwData.keywords);

          let initialKw: Keyword | undefined;
          if (keywordIdParam) {
            const parsedId = parseInt(keywordIdParam, 10);
            initialKw = kwData.keywords.find((k: Keyword) => k.id === parsedId);
          }
          if (!initialKw && kwData.keywords.length > 0) {
            initialKw = kwData.keywords[0];
          }
          if (initialKw) {
            setSelectedKeywordId(initialKw.id);
            if (initialKw.cluster?.name) {
              const clusterKws = kwData.keywords
                .filter((k: Keyword) => k.cluster?.name === initialKw?.cluster?.name && k.id !== initialKw?.id)
                .slice(0, 3)
                .map((k: Keyword) => k.keyword);
              if (clusterKws.length > 0) {
                setSecondaryText(clusterKws.join(", "));
              }
            }
          }
        }
      } catch {
        if (!cancelled) setError("Could not load project data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [projectId, keywordIdParam]);

  const activeKeyword = useMemo(() => {
    return keywords.find((k) => k.id === selectedKeywordId) || null;
  }, [keywords, selectedKeywordId]);

  // Suggested secondary keywords from same cluster
  const clusterSuggestions = useMemo(() => {
    if (!activeKeyword?.cluster?.name) return [];
    return keywords
      .filter((k) => k.cluster?.name === activeKeyword.cluster?.name && k.id !== activeKeyword.id)
      .slice(0, 5)
      .map((k) => k.keyword);
  }, [keywords, activeKeyword]);

  function addSecondaryKeyword(kw: string) {
    const existing = secondaryText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!existing.includes(kw)) {
      const updated = existing.length > 0 ? `${secondaryText.trim().replace(/,$/, "")}, ${kw}` : kw;
      setSecondaryText(updated);
    }
  }

  async function handleStartWriting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKeywordId) {
      setError("Please select a target keyword.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const parsedSecondaries = secondaryText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordId: selectedKeywordId,
          customTitle: customTitle.trim() || undefined,
          contentType,
          targetWords,
          tone,
          extraInstructions: extraInstructions.trim(),
          secondaryKeywords: parsedSecondaries,
          mode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to start writing.");
        setSubmitting(false);
        return;
      }

      // Immediately navigate to the full Article Writer page
      router.push(`/generations/${data.generationId}`);
    } catch {
      setError("Connection error. Could not start article generation.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Breadcrumbs />

      {project && <ProjectTabs projectId={projectId} />}

      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sliders className="h-3.5 w-3.5" /> Content Brief Builder
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Configure Content Brief
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Define tone, length, format, and keywords. Once ready, click Start Writing to generate the article.
          </p>
        </div>

        {activeKeyword && (
          <Link
            href={`/serp?q=${encodeURIComponent(activeKeyword.keyword)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100 sm:self-auto"
          >
            <Search className="h-4 w-4" /> Check SERP First
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleStartWriting} className="space-y-8">
        {/* Step 1: Select Target Keyword */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-base font-semibold text-slate-900">
            1. Target Primary Keyword
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            Select the focus keyword from this project that the article will be optimized around.
          </p>

          <div className="mt-4">
            {keywords.length > 0 ? (
              <select
                value={selectedKeywordId || ""}
                onChange={(e) => setSelectedKeywordId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {keywords.map((kw) => (
                  <option key={kw.id} value={kw.id}>
                    {kw.keyword} {kw.cluster?.name ? `(Cluster: ${kw.cluster.name})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
                No keywords found in this project.{" "}
                <Link href={`/projects/${projectId}/keywords`} className="font-semibold text-blue-600 hover:underline">
                  Add keywords first
                </Link>
              </div>
            )}

            {/* Keyword metadata pills */}
            {activeKeyword && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {activeKeyword.cluster?.name && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 font-medium text-purple-700 border border-purple-200">
                    <Tag className="h-3 w-3" /> Cluster: {activeKeyword.cluster.name}
                  </span>
                )}
                {activeKeyword.intent && (
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700 border border-blue-200">
                    Intent: {activeKeyword.intent}
                  </span>
                )}
                {activeKeyword.volume !== null && activeKeyword.volume !== undefined && (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    Volume: {activeKeyword.volume}
                  </span>
                )}
                {activeKeyword.difficulty !== null && activeKeyword.difficulty !== undefined && (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    Difficulty: {activeKeyword.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Article Title (Optional) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="block text-base font-semibold text-slate-900">
              2. Article Title <span className="text-xs font-normal text-slate-500">(Optional)</span>
            </label>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              Leave blank for AI auto-title
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Have a specific headline or client-requested title? Enter it here. Leave empty to let AI craft an SEO-optimized, unique H1 title.
          </p>

          <div className="mt-4">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={200}
              placeholder={activeKeyword ? `e.g. Complete Guide to ${activeKeyword.keyword} (leave blank for AI title)` : "e.g. Complete Guide to Your Keyword (leave blank for AI title)"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {customTitle.trim()
                ? "This exact title will be strictly used for the article H1 and primary headline."
                : "AI will generate a compelling, high-ranking headline based on your target keyword."}
            </p>
          </div>
        </div>

        {/* Step 3: Content Format & Length */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-base font-semibold text-slate-900">
            3. Content Type & Article Length
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONTENT_TYPES.map((type) => (
              <label
                key={type.value}
                className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                  contentType === type.value
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="contentType"
                  value={type.value}
                  checked={contentType === type.value}
                  onChange={(e) => setContentType(e.target.value)}
                  className="sr-only"
                />
                <span className="font-semibold text-slate-900">{type.label}</span>
                <span className="mt-1 text-xs text-slate-500 leading-relaxed">{type.desc}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                Target Word Count: <span className="text-blue-600">{targetWords} words</span>
              </span>
              <span className="text-xs text-slate-500">
                ~{Math.round(targetWords / 250)} min read
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={3000}
              step={100}
              value={targetWords}
              onChange={(e) => setTargetWords(Number(e.target.value))}
              className="mt-3 w-full accent-blue-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1,000 words (Standard)</span>
              <span>2,000 words (In-depth)</span>
              <span>3,000 words (Ultimate Guide)</span>
            </div>
          </div>
        </div>

        {/* Step 4: Tone & Voice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-base font-semibold text-slate-900">
            4. Tone & Brand Voice
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TONES.map((t) => (
              <label
                key={t.value}
                className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                  tone === t.value
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={(e) => setTone(e.target.value)}
                  className="sr-only"
                />
                <span className="font-semibold text-slate-900">{t.label}</span>
                <span className="mt-1 text-xs text-slate-500">{t.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 5: Secondary Keywords & Extra Guidance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-base font-semibold text-slate-900">
            5. Secondary Keywords & Extra Instructions
          </label>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Secondary Keywords (comma separated)
            </label>
            <input
              type="text"
              value={secondaryText}
              onChange={(e) => setSecondaryText(e.target.value)}
              placeholder="e.g. terrace leak repair, best roof sealant, waterproofing cost"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            {/* Clickable cluster suggestions */}
            {clusterSuggestions.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500">From same cluster:</span>
                {clusterSuggestions.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => addSecondaryKeyword(kw)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    + {kw}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Extra Instructions (optional)
              </label>
              <span className="text-xs text-slate-500">{extraInstructions.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder="Mention common monsoon challenges, include a pricing breakdown table, keep paragraphs under 3 sentences..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <label className="block text-sm font-medium text-slate-700">Writing Mode</label>
            <div className="mt-2 grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  mode === "ai"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Zap className="h-4 w-4" /> Standard AI (1 credit)
              </button>
              <button
                type="button"
                onClick={() => setMode("humanized")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  mode === "humanized"
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="h-4 w-4" /> Humanized (1 credit)
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Cost: 1 Credit</p>
              <p className="text-xs text-slate-500">
                Automatic refund if generation fails. Takes ~2–3 minutes.
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <Link
              href={`/projects/${projectId}/keywords`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !selectedKeywordId}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 sm:flex-initial"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Starting Engine...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> Start Writing
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function ProjectBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const projectId = parseInt(id, 10);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BriefForm projectId={projectId} />
    </Suspense>
  );
}
