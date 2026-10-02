"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Gauge, Loader2, PenLine, Save } from "lucide-react";

interface RuleResult {
  rule: string;
  status: string;
  value: number;
  hint: string;
}

interface Validation {
  words: number;
  h2Count: number;
  keywordDensity: number;
  readability: { flesch: number };
  avgSentence: number;
  report: RuleResult[];
  qualityScore: number;
}

interface Project {
  id: number;
  name: string;
}

const RULE_LABELS: Record<string, string> = {
  h1_count: "Exactly one H1",
  h2_count: "At least 4 H2 sections",
  word_count: "Word target",
  keyword_density: "Keyword density 0.4-2%",
  avg_sentence: "Sentences under 25 words",
  meta_title_length: "Meta title 30-65 chars",
  meta_desc_length: "Meta description 120-165 chars",
};

export default function HumanWritePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [targetWords, setTargetWords] = useState("1200");
  const [body, setBody] = useState("");
  const [validation, setValidation] = useState<Validation | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.projects?.length) {
          setProjects(data.projects);
          setProjectId(String(data.projects[0].id));
        }
      })
      .catch(() => {});
  }, []);

  async function checkScore() {
    if (checking || saving) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/contents/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score",
          keyword,
          title,
          body,
          metaTitle,
          metaDescription,
          targetWords: parseInt(targetWords, 10) || 1200,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/human/new");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Check failed.");
        return;
      }
      setValidation(data.validation);
    } catch {
      setError("Check failed. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  async function saveDraft() {
    if (checking || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contents/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          projectId: parseInt(projectId, 10),
          keyword,
          title,
          body,
          metaTitle,
          metaDescription,
          targetWords: parseInt(targetWords, 10) || 1200,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/human/new");
        return;
      }
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Save failed.");
        return;
      }
      router.push(`/contents/${data.contentId}`);
    } catch {
      setError("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const words = body.split(/\s+/).filter(Boolean).length;
  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <PenLine className="h-5 w-5 text-emerald-700" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Write human article</h1>
          <p className="text-sm text-slate-600">100% your words — the AI writes nothing here. Free forever.</p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Project</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {projects.length === 0 && <option value="">Create a project first (New project above)</option>}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Keyword</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="best lion safari in gir"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Title (becomes the H1)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Best Lion Safari in Gir: A Practical Guide"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Meta title <span className="font-normal text-slate-500">({metaTitle.length} chars)</span>
              </label>
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Target words</label>
              <input
                value={targetWords}
                onChange={(e) => setTargetWords(e.target.value)}
                inputMode="numeric"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Meta description <span className="font-normal text-slate-500">({metaDescription.length} chars)</span>
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Your article <span className="font-normal text-slate-500">({words} words — use ## for headings)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              placeholder={"## Best time to visit\n\nWrite your paragraphs here...\n\n## What to carry\n\nMore paragraphs..."}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
            />
            <p className="mt-1 text-xs text-slate-500">
              The title box becomes the H1 — do not type # in here. Use ## for section headings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={checkScore}
              disabled={checking || saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />}
              {checking ? "Checking..." : "Check SEO score"}
            </button>
            <button
              onClick={saveDraft}
              disabled={checking || saving || projects.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save draft (free)"}
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h2 className="font-semibold text-slate-900">SEO score</h2>
          {!validation ? (
            <p className="mt-3 text-sm text-slate-500">
              Write something, then press Check SEO score. No AI key needed — the score is pure maths.
            </p>
          ) : (
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-bold ${
                    validation.qualityScore >= 80
                      ? "text-green-600"
                      : validation.qualityScore >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {validation.qualityScore}
                </span>
                <span className="text-sm text-slate-500">/ 100</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {validation.words} words · density {validation.keywordDensity}% · Flesch{" "}
                {validation.readability.flesch.toFixed(0)}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {validation.report.map((rule) => (
                  <li key={rule.rule} className="flex items-start gap-2">
                    {rule.status === "pass" ? (
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : rule.status === "warn" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <span className="text-slate-700">
                      <span className="font-medium">{RULE_LABELS[rule.rule] || rule.rule}</span>: {rule.value}{" "}
                      <span className="text-xs text-slate-500">({rule.hint})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}