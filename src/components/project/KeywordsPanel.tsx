"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GenerateModal } from "@/components/project/GenerateModal";
import { MAX_KEYWORD_UPLOAD_BYTES, MAX_KEYWORD_UPLOAD_LABEL } from "@/lib/upload-limits";
import {
  CheckCircle,
  Download,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
  Sliders,
} from "lucide-react";

interface Keyword {
  id: number;
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: string;
  status: string;
  cluster?: { name: string } | null;
}

interface Project {
  id: number;
  name: string;
  websiteUrl: string;
}

// Keyword list for one project: upload, paste, filter, and open Make content.
export function KeywordsPanel({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadReport, setUploadReport] = useState<any>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [sourceId, setSourceId] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [pastedKeywords, setPastedKeywords] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [generateKeyword, setGenerateKeyword] = useState<Keyword | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [bulkProg, setBulkProg] = useState("");

  useEffect(() => {
    loadProject();
    loadKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (data.success) setProject(data.project);
    else setMissing(true);
  }

  async function loadKeywords() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/keywords?limit=200`);
    const data = await res.json();
    if (data.success) setKeywords(data.keywords);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_KEYWORD_UPLOAD_BYTES) {
      alert(`Choose a file no larger than ${MAX_KEYWORD_UPLOAD_LABEL}.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    setUploadReport(null);
    setPreviewRows([]);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/sources`, { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.success) {
      setSourceId(data.source.id);
      setPreviewRows(data.preview);
      setUploadReport(data.report);
    } else {
      alert(data.message);
    }
  }

  async function commitKeywords() {
    if (!sourceId) return;
    const excluded = Array.from(selectedRows);
    const res = await fetch(`/api/projects/${projectId}/sources/${sourceId}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: previewRows, excluded }),
    });
    const data = await res.json();
    if (data.success) {
      setPreviewRows([]);
      setUploadReport(null);
      setSourceId(null);
      loadKeywords();
    } else {
      alert(data.message);
    }
  }

  async function addPastedKeywords() {
    const list = pastedKeywords
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (list.length === 0) return;
    const res = await fetch(`/api/projects/${projectId}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: list }),
    });
    const data = await res.json();
    if (data.success) {
      setPastedKeywords("");
      setShowPaste(false);
      loadKeywords();
    } else {
      alert(data.message);
    }
  }

  async function updateKeywordStatus(id: number, status: string) {
    const res = await fetch(`/api/keywords/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadKeywords();
  }

  async function deleteKeyword(id: number) {
    if (!confirm("Delete this keyword?")) return;
    await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    loadKeywords();
  }

  function toggleCheck(id: number) {
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIds(next);
  }

  async function bulkGenerate() {
    const ids = Array.from(checkedIds).slice(0, 10);
    if (ids.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    setBulkMsg("");
    setBulkProg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/bulk-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordIds: ids }),
      });
      const data = await res.json();
      if (!data.success) {
        setBulkMsg(data.message || "Bulk start failed.");
        return;
      }
      const started = data.started || [];
      const failed = data.failed || [];
      // Drive jobs one by one (same step-loop as single generate).
      for (let s = 0; s < started.length; s++) {
        const g = started[s];
        for (let i = 0; i < 40; i++) {
          setBulkProg(`Article ${s + 1}/${started.length} ...`);
          const stepRes = await fetch(`/api/generations/${g.generationId}/step`, { method: "POST" });
          const step = await stepRes.json();
          if (!step.success) throw new Error(step.message || "Stage failed.");
          if (step.progress) setBulkProg(`Article ${s + 1}/${started.length} ... ${step.progress}%`);
          if (step.done) break;
        }
      }
      setBulkMsg(
        `Done: ${started.length} article(s) ready${failed.length > 0 ? `, ${failed.length} failed (${failed[0].error})` : ""}. See Library.`
      );
      setCheckedIds(new Set());
      loadKeywords();
    } catch (err) {
      setBulkMsg(err instanceof Error ? err.message : "Bulk failed.");
    } finally {
      setBulkBusy(false);
      setBulkProg("");
    }
  }

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      const matchesQ = k.keyword.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = statusFilter ? k.status === statusFilter : true;
      return matchesQ && matchesStatus;
    });
  }, [keywords, q, statusFilter]);

  if (missing) {
    return <p className="text-sm text-slate-600">Project not found.</p>;
  }

  if (!project) {
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

      <div className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload keyword file
              <input type="file" className="hidden" onChange={handleUpload} accept=".csv,.xlsx,.xls,.txt,.json,.pdf,.docx" />
            </label>
            <a
              href="/sample-keywords.csv"
              download
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Sample CSV
            </a>
            <button
              onClick={() => setShowPaste(!showPaste)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" /> Paste keywords
            </button>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search keywords..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm sm:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        {showPaste && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">Paste keywords (one per line or comma-separated)</label>
            <textarea
              value={pastedKeywords}
              onChange={(e) => setPastedKeywords(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={addPastedKeywords}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add keywords
              </button>
              <button onClick={() => setShowPaste(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </div>
        )}

        {uploadReport && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Parse report: {uploadReport.fileName}</p>
                <p className="text-sm text-blue-800">
                  Rows found: {uploadReport.rowsFound} · Saved: {uploadReport.keywordsSaved} · Duplicates: {uploadReport.duplicatesRemoved}
                </p>
                {uploadReport.warnings?.map((w: string, i: number) => (
                  <p key={i} className="mt-1 text-xs text-amber-700">Warning: {w}</p>
                ))}
              </div>
              <button onClick={() => { setUploadReport(null); setPreviewRows([]); }}>
                <X className="h-4 w-4 text-blue-700" />
              </button>
            </div>
            {previewRows.length > 0 && (
              <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-blue-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Include</th>
                      <th className="px-3 py-2">Keyword</th>
                      <th className="px-3 py-2">Volume</th>
                      <th className="px-3 py-2">Intent</th>
                      <th className="px-3 py-2">Cluster</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={!selectedRows.has(idx)}
                            onChange={(e) => {
                              const next = new Set(selectedRows);
                              if (e.target.checked) next.delete(idx);
                              else next.add(idx);
                              setSelectedRows(next);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.keyword}</td>
                        <td className="px-3 py-2">{row.volume || "-"}</td>
                        <td className="px-3 py-2">{row.intent || "-"}</td>
                        <td className="px-3 py-2">{row.cluster || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={commitKeywords}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4" /> Save {previewRows.length - selectedRows.size} keywords
            </button>
          </div>
        )}

        {checkedIds.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
            <span className="font-medium text-slate-900">{checkedIds.size} selected (max 10 per batch)</span>
            <button
              onClick={bulkGenerate}
              disabled={bulkBusy}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {bulkBusy ? "Working..." : `Generate ${Math.min(checkedIds.size, 10)} (${Math.min(checkedIds.size, 10)} credits)`}
            </button>
            <button onClick={() => setCheckedIds(new Set())} disabled={bulkBusy} className="text-slate-600 hover:underline">
              Clear
            </button>
            {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            {bulkProg && <span className="text-slate-700">{bulkProg}</span>}
          </div>
        )}
        {bulkMsg && (
          <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{bulkMsg}</p>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((k) => checkedIds.has(k.id))}
                    onChange={(e) => {
                      if (e.target.checked) setCheckedIds(new Set(filtered.map((k) => k.id)));
                      else setCheckedIds(new Set());
                    }}
                    aria-label="Select all keywords"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Keyword</th>
                <th className="px-4 py-3 font-medium">Volume</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Cluster</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((k) => (
                <tr key={k.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checkedIds.has(k.id)}
                      onChange={() => toggleCheck(k.id)}
                      aria-label={`Select ${k.keyword}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{k.keyword}</td>
                  <td className="px-4 py-3 text-slate-600">{k.volume ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{k.difficulty ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{k.intent || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{k.cluster?.name || "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={k.status}
                      onChange={(e) => updateKeywordStatus(k.id, e.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/serp?q=${encodeURIComponent(k.keyword)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        title="Inspect Google SERP"
                      >
                        <Search className="h-3 w-3" /> SERP
                      </Link>
                      <Link
                        href={`/projects/${projectId}/brief?keywordId=${k.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        title="Configure Content Brief"
                      >
                        <Sliders className="h-3 w-3" /> Brief
                      </Link>
                      <button
                        onClick={() => setGenerateKeyword(k)}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        title="Quick generate popup"
                      >
                        Make content
                      </button>
                      <button onClick={() => deleteKeyword(k.id)} className="text-slate-400 hover:text-red-600" title="Delete keyword">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    No keywords yet. Upload a file or paste a list above.
                    <br />
                    <span className="text-xs text-slate-400">Sample: waterproofing services in surat, terrace leak repair, bathroom waterproofing cost</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {generateKeyword && (
        <GenerateModal
          project={project}
          keyword={generateKeyword}
          keywords={keywords}
          onClose={() => setGenerateKeyword(null)}
          onDone={() => {
            setGenerateKeyword(null);
            loadKeywords();
          }}
        />
      )}
    </div>
  );
}