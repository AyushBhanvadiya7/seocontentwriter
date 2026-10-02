"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FileText,
  Tags,
  Pencil,
  FileDown,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Clock,
  Check,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface GenerationState {
  generationId: number;
  status: "queued" | "running" | "completed" | "failed";
  stage: string;
  stageLabel: string;
  progress: number;
  done: boolean;
  contentId?: number | null;
  errorMessage?: string | null;
  piecesWritten?: number;
  totalPieces?: number;
  tokensIn?: number;
  tokensOut?: number;
}

const STAGES = [
  { key: "research", label: "Research", desc: "SERP analysis & reader intent" },
  { key: "outline", label: "Outline", desc: "Structure, headings & angle" },
  { key: "writing", label: "Writing", desc: "Drafting sections & content" },
  { key: "packaging", label: "Packaging", desc: "Meta tags, schema & FAQs" },
  { key: "finalizing", label: "Finalizing", desc: "Links, quality check & saving" },
];

export default function ArticleWriterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const generationId = parseInt(id, 10);
  const router = useRouter();

  const [state, setState] = useState<GenerationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stageMessage, setStageMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const loopActiveRef = useRef(false);

  // Step runner function
  const runNextStep = useCallback(async () => {
    if (loopActiveRef.current) return;
    loopActiveRef.current = true;
    setRunning(true);
    setError(null);

    try {
      // Loop up to 40 times to complete all stages
      for (let i = 0; i < 40; i++) {
        const res = await fetch(`/api/generations/${generationId}/step`, {
          method: "POST",
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Stage execution failed.");
          setState((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  errorMessage: data.message || "Stage failed.",
                }
              : null
          );
          break;
        }

        setStageMessage(data.message || "");
        setState((prev) => ({
          generationId,
          status: data.done ? "completed" : "running",
          stage: data.stage || prev?.stage || "research",
          stageLabel: data.stageLabel || data.stage || "Writing...",
          progress: data.progress ?? (data.done ? 100 : (prev?.progress ?? 20)),
          done: Boolean(data.done),
          contentId: data.contentId ?? prev?.contentId ?? null,
        }));

        if (data.done) {
          break;
        }
      }
    } catch {
      setError("Network or server connection issue while generating.");
    } finally {
      loopActiveRef.current = false;
      setRunning(false);
    }
  }, [generationId]);

  // Initial load: check server state
  useEffect(() => {
    let cancelled = false;

    async function checkState() {
      try {
        const res = await fetch(`/api/generations/${generationId}/step`);
        const json = await res.json();

        if (cancelled) return;

        if (!json.success) {
          setError(json.message || "Generation not found.");
          setLoading(false);
          return;
        }

        setState(json);
        setLoading(false);

        // If not done and not failed, automatically start/resume running stages
        if (!json.done && json.status !== "failed") {
          runNextStep();
        }
      } catch {
        if (!cancelled) {
          setError("Could not load generation state.");
          setLoading(false);
        }
      }
    }

    checkState();

    return () => {
      cancelled = true;
      loopActiveRef.current = false;
    };
  }, [generationId, runNextStep]);

  // Timer for elapsed time
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const activeStageIndex = state?.done
    ? 5
    : STAGES.findIndex((s) => s.key === state?.stage);

  if (loading) {
    return (
      <div className="flex min-h-[450px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">Connecting to generation engine...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs />

      {/* COMPLETED VIEW */}
      {state?.done && state.contentId ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Article Generation Completed!
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Your researched, publish-ready SEO article has been written, formatted, and validated.
            </p>
          </div>

          {/* 4 Action Buttons Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href={`/contents/${state.contentId}`}
              className="flex items-center justify-between rounded-2xl border-2 border-blue-600 bg-blue-600 p-5 text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
            >
              <div className="flex items-center gap-3.5">
                <FileText className="h-6 w-6" />
                <div className="text-left">
                  <span className="block font-bold">Open Article</span>
                  <span className="text-xs text-blue-100">Read & preview draft</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href={`/contents/${state.contentId}/seo`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <Tags className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <span className="block font-bold">SEO & Schema</span>
                  <span className="text-xs text-slate-500">Meta tags, FAQ JSON-LD</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              href={`/contents/${state.contentId}/edit`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <Pencil className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <span className="block font-bold">Edit Article</span>
                  <span className="text-xs text-slate-500">Customize text & headings</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              href={`/contents/${state.contentId}/export`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm transition hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <FileDown className="h-6 w-6 text-blue-600" />
                <div className="text-left">
                  <span className="block font-bold">Export Files</span>
                  <span className="text-xs text-slate-500">Word .docx, HTML, Markdown</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              ← Back to Project Dashboard
            </Link>
          </div>
        </div>
      ) : state?.status === "failed" ? (
        /* FAILED VIEW */
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle className="h-9 w-9" />
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Generation Could Not Complete
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {state.errorMessage || error || "An unexpected error interrupted generation."}
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> 1 Credit Auto-Refunded
            </div>
            <p className="mt-1 text-xs text-emerald-800">
              Your credit balance has been automatically restored. No credit was deducted.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={runNextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" /> Retry Generation
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      ) : (
        /* IN PROGRESS / ACTIVE WRITER VIEW */
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" /> 8-Stage Generation Engine
                </div>
                <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {state?.stageLabel || "Writing Your Article..."}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {stageMessage || "Executing pipeline steps. Safe to refresh or close — progress is saved."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Elapsed: {elapsedSec}s</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-700">Overall Progress</span>
                <span className="text-blue-600">{state?.progress ?? 0}%</span>
              </div>
              <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
                  style={{ width: `${state?.progress ?? 5}%` }}
                />
              </div>
            </div>

            {/* Stage Milestones */}
            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {STAGES.map((s, idx) => {
                const isPassed = activeStageIndex > idx;
                const isCurrent = activeStageIndex === idx;

                return (
                  <div
                    key={s.key}
                    className={`rounded-2xl border p-3 text-left transition ${
                      isCurrent
                        ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                        : isPassed
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        0{idx + 1}
                      </span>
                      {isPassed ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : null}
                    </div>
                    <p className={`mt-2 font-semibold text-sm ${isCurrent ? "text-blue-900" : "text-slate-800"}`}>
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Control buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>If anything fails, 1 credit is automatically refunded.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runNextStep}
                  disabled={running}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing Next Stage...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" /> Continue Writing
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
