"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface BrandVoiceRow {
  tone?: string | null;
  readingLevel?: string | null;
  authorName?: string | null;
  authorBio?: string | null;
  authorCredentials?: string | null;
  sampleWriting?: string | null;
  standardCta?: string | null;
  mustUseWords?: string[] | null;
  bannedWords?: string[] | null;
  forbiddenTopics?: string[] | null;
  uniqueExperienceFacts?: string[] | null;
  disclaimers?: string[] | null;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

function joinList(v: string[] | null | undefined): string {
  return Array.isArray(v) ? v.join(", ") : "";
}

const emptyForm = {
  tone: "simple English",
  readingLevel: "Grade 7",
  authorName: "",
  authorBio: "",
  authorCredentials: "",
  sampleWriting: "",
  standardCta: "",
  mustUseWords: "",
  bannedWords: "",
  forbiddenTopics: "",
  uniqueExperienceFacts: "",
  disclaimers: "",
};

// Tone, author, and word rules used by new articles in this project.
export function BrandVoicePanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadProject() {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (cancelled) return;
      if (data.success) setProject(data.project);
      else setMissing(true);
    }

    async function loadVoice() {
      try {
        const res = await fetch(`/api/projects/${projectId}/brand-voice`);
        const data = await res.json();
        if (cancelled) return;
        const bv = (data.brandVoice || {}) as BrandVoiceRow;
        if (data.success && data.brandVoice) {
          setForm({
            tone: bv.tone || "simple English",
            readingLevel: bv.readingLevel || "Grade 7",
            authorName: bv.authorName || "",
            authorBio: bv.authorBio || "",
            authorCredentials: bv.authorCredentials || "",
            sampleWriting: bv.sampleWriting || "",
            standardCta: bv.standardCta || "",
            mustUseWords: joinList(bv.mustUseWords),
            bannedWords: joinList(bv.bannedWords),
            forbiddenTopics: joinList(bv.forbiddenTopics),
            uniqueExperienceFacts: joinList(bv.uniqueExperienceFacts),
            disclaimers: joinList(bv.disclaimers),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProject();
    loadVoice();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/brand-voice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ ok: false, text: data.message || "Save failed." });
        return;
      }
      setMsg({ ok: true, text: "Brand voice saved. New articles will use it." });
    } catch {
      setMsg({ ok: false, text: "Save failed. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  if (missing) {
    return <p className="text-sm text-slate-600">Project not found.</p>;
  }

  if (!project || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-600">{project.websiteUrl}</p>
        </div>
        <Link href={`/projects/${projectId}`} className="text-sm font-medium text-blue-600 hover:underline">
          Back to project
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <p className="text-sm text-slate-600">
          Teach the writer how you sound. New articles will follow this voice, avoid banned words,
          and use your sample paragraph as a style guide.
        </p>
        {msg && (
          <p className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg.text}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Tone</label>
            <input value={form.tone} onChange={(e) => setField("tone", e.target.value)} placeholder="simple English" className={inputClass} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Reading level</label>
            <input value={form.readingLevel} onChange={(e) => setField("readingLevel", e.target.value)} placeholder="Grade 7" className={inputClass} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Author name</label>
          <input value={form.authorName} onChange={(e) => setField("authorName", e.target.value)} placeholder="Ramesh Patel" className={inputClass} />
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">Author bio</label>
            <textarea value={form.authorBio} onChange={(e) => setField("authorBio", e.target.value)} rows={3} placeholder="10 years writing about Gujarat tourism..." className={inputClass} />
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">Author credentials</label>
            <textarea value={form.authorCredentials} onChange={(e) => setField("authorCredentials", e.target.value)} rows={2} placeholder="Certified naturalist, 200+ safaris guided..." className={inputClass} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Sample of your writing</label>
          <p className="mt-1 text-xs text-slate-500">Paste 2-4 lines you wrote. The AI will copy this style.</p>
          <textarea value={form.sampleWriting} onChange={(e) => setField("sampleWriting", e.target.value)} rows={4} placeholder="The Gir forest wakes up before the sun..." className={inputClass} />
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">Standard call-to-action</label>
            <textarea value={form.standardCta} onChange={(e) => setField("standardCta", e.target.value)} rows={2} placeholder="Book your safari at..." className={inputClass} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Words to always use</label>
            <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
            <textarea value={form.mustUseWords} onChange={(e) => setField("mustUseWords", e.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Banned words (never use)</label>
            <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
            <textarea value={form.bannedWords} onChange={(e) => setField("bannedWords", e.target.value)} rows={3} placeholder="leverage, synergy, delve" className={inputClass} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Forbidden topics</label>
            <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
            <textarea value={form.forbiddenTopics} onChange={(e) => setField("forbiddenTopics", e.target.value)} rows={3} className={inputClass} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-medium text-slate-700">Facts only you know</label>
            <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
            <textarea value={form.uniqueExperienceFacts} onChange={(e) => setField("uniqueExperienceFacts", e.target.value)} rows={3} className={inputClass} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Disclaimers</label>
          <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
          <textarea value={form.disclaimers} onChange={(e) => setField("disclaimers", e.target.value)} rows={2} className={inputClass} />
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save brand voice"}
        </button>
      </div>
    </div>
  );
}