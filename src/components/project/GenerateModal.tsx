"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Loader2, PenLine, Sparkles, X } from "lucide-react";

// Shared shapes for project panels. Full Project/Keyword objects from pages
// fit these smaller types, so panels stay decoupled from page internals.
export interface PanelKeyword {
  id: number;
  keyword: string;
  status: string;
  cluster?: { name: string } | null;
}

export interface PanelProject {
  id: number;
  name: string;
}

// Make-content popup: options -> staged generation -> opens the article.
// Used by the keywords panel and the content panel.
export function GenerateModal({
  project,
  keyword,
  keywords,
  onClose,
  onDone,
}: {
  project: PanelProject;
  keyword: PanelKeyword;
  keywords: PanelKeyword[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [contentType, setContentType] = useState("blog_post");
  const [customTitle, setCustomTitle] = useState("");
  const [targetWords, setTargetWords] = useState(1200);
  const [tone, setTone] = useState("simple English");
  const [extra, setExtra] = useState("");
  const [mode, setMode] = useState<"ai" | "humanized">("ai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState("");
  const [stageMessage, setStageMessage] = useState("");
  const [finishedId, setFinishedId] = useState<number | null>(null);

  const suggestions = useMemo(() => {
    const sameCluster = keywords.filter(
      (k) => k.cluster?.name === keyword.cluster?.name && k.id !== keyword.id
    );
    return sameCluster.slice(0, 3).map((k) => k.keyword);
  }, [keywords, keyword]);

  const [secondaryText, setSecondaryText] = useState(() => suggestions.join(", "));

  async function generate() {
    setLoading(true);
    setError("");
    setProgress(0);
    setStageLabel("Starting...");
    setStageMessage("");
    setFinishedId(null);
    try {
      const parsedSecondaries = secondaryText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordId: keyword.id,
          customTitle: customTitle.trim() || undefined,
          contentType,
          targetWords,
          tone,
          extraInstructions: extra,
          secondaryKeywords: parsedSecondaries,
          mode,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Could not start generation.");
        setLoading(false);
        return;
      }

      // Run one stage per request until the article is done.
      const generationId = data.generationId;
      for (let i = 0; i < 40; i++) {
        const stepRes = await fetch(`/api/generations/${generationId}/step`, { method: "POST" });
        const step = await stepRes.json();
        if (!step.success) {
          throw new Error(step.message || "Stage failed.");
        }
        setProgress(step.progress ?? 0);
        setStageLabel(step.stageLabel || step.stage || "");
        setStageMessage(step.message || "");
        if (step.done) {
          setFinishedId(step.contentId ?? null);
          setProgress(100);
          onDone();
          if (step.contentId) {
            window.open(`/contents/${step.contentId}`, "_blank");
          }
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showProgress = loading || finishedId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Make content</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">Keyword: <span className="font-medium text-slate-900">{keyword.keyword}</span></p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        {showProgress ? (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">
                {finishedId !== null ? "Article is ready." : stageLabel || "Working..."}
              </span>
              <span className="text-slate-600">{progress}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {stageMessage && !finishedId && (
              <p className="mt-3 text-sm text-slate-600">{stageMessage}</p>
            )}
            {loading && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Writing your article, one stage at a time. Keep this window open.
              </p>
            )}
            {finishedId !== null && (
              <div className="mt-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-slate-700">
                  Done. The article opened in a new tab.
                </p>
                <a
                  href={`/contents/${finishedId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Open article
                </a>
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Article title</label>
                <span className="text-xs text-slate-500 font-normal">Optional (auto-generated if empty)</span>
              </div>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={`e.g. Complete Guide to ${keyword.keyword} (leave blank for AI title)`}
              />
              <p className="mt-1 text-xs text-slate-500">
                If specified, your exact title will be used as the article&apos;s H1 headline.
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Content type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="blog_post">Blog post</option>
                  <option value="article">Long-form article / pillar</option>
                  <option value="landing_page">Landing page</option>
                  <option value="service_page">Service page</option>
                  <option value="faq_page">FAQ page</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Word count: {targetWords}</label>
                <input
                  type="range"
                  min={1000}
                  max={3000}
                  step={100}
                  value={targetWords}
                  onChange={(e) => setTargetWords(Number(e.target.value))}
                  className="mt-3 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="simple English">Simple English</option>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="persuasive">Persuasive</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Secondary keywords</label>
                <input
                  type="text"
                  value={secondaryText}
                  onChange={(e) => setSecondaryText(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="terrace waterproofing, bathroom leak repair"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">Extra instructions</label>
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Mention monsoon season, include a cost table, keep paragraphs short..."
              />
              <p className="mt-1 text-xs text-slate-500">{extra.length}/500</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700">Writing mode</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("ai")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    mode === "ai"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="h-4 w-4" /> AI content
                </button>
                <button
                  type="button"
                  onClick={() => setMode("humanized")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    mode === "humanized"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <PenLine className="h-4 w-4" /> Humanized
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {mode === "humanized"
                  ? "Human voice, detector-friendly wording. Same 1 credit."
                  : "Standard AI article. Same 1 credit."}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">Estimated: 1 credit · ~2-3 minutes</p>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}