"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProjectTabs } from "@/components/project/ProjectTabs";
import { GenerateModal } from "@/components/project/GenerateModal";

import {
  Loader2,
  Upload,
  Search,
  FileText,
  Plus,
  Filter,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle,
  X,
  Download,
  PenLine,
  Sliders,
  MapPin,
  Globe,
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
  businessDescription: string;
  language: string;
  targetCountry: string;
  targetCity?: string;
  settings?: Record<string, unknown> | null;
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = parseInt(params.id as string, 10);
  const [tab, setTab] = useState("keywords");
  const [project, setProject] = useState<Project | null>(null);
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
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSiteType, setEditSiteType] = useState<"local" | "global">("local");
  const [editCity, setEditCity] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProject();
    loadKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    if (data.success) setProject(data.project);
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

  function startEdit() {
    if (!project) return;
    setEditName(project.name || "");
    setEditUrl(project.websiteUrl || "");
    setEditDesc(project.businessDescription || "");
    const currentSiteType =
      ((project.settings as Record<string, unknown>)?.siteType as "local" | "global") ||
      (project.targetCity ? "local" : "global");
    setEditSiteType(currentSiteType);
    setEditCity(project.targetCity || "");
    setEditError("");
    setEditing(true);
  }

  async function saveEdit() {
    if (!project || editBusy) return;
    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }
    if (editSiteType === "local" && !editCity.trim()) {
      setEditError("City is required for Local projects.");
      return;
    }
    setEditBusy(true);
    setEditError("");
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          websiteUrl: editUrl.trim(),
          businessDescription: editDesc.trim(),
          siteType: editSiteType,
          targetCity: editSiteType === "local" ? editCity.trim() : null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.message || "Save failed.");
        return;
      }
      setProject({ ...project, ...data.project });
      setEditing(false);
    } catch {
      setEditError("Save failed. Check your connection and try again.");
    } finally {
      setEditBusy(false);
    }
  }

  async function deleteProject() {
    if (!project || deleting) return;
    if (!window.confirm(`Delete "${project.name}" and ALL its keywords and articles forever?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed.");
      router.push("/dashboard");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    return keywords.filter((k) => {
      const matchesQ = k.keyword.toLowerCase().includes(q.toLowerCase());
      const matchesStatus = statusFilter ? k.status === statusFilter : true;
      return matchesQ && matchesStatus;
    });
  }, [keywords, q, statusFilter]);

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            {((project.settings as Record<string, unknown>)?.siteType === "global") ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                <Globe className="h-3 w-3 text-slate-500" /> Global Website
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <MapPin className="h-3 w-3 text-blue-600" /> Local Business {project.targetCity ? `(${project.targetCity})` : ""}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {project.websiteUrl} · {project.targetCity ? `${project.targetCity}, ` : ""}{project.targetCountry} · {project.language.toUpperCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTab("keywords");
              if (keywords.length > 0) setGenerateKeyword(keywords[0]);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" /> Make content
          </button>
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={deleteProject}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {editing && project && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Edit project</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Website URL</label>
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">Project Type</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditSiteType("local")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition ${
                  editSiteType === "local"
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-blue-600" /> Local Business
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditSiteType("global");
                  setEditCity("");
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-semibold transition ${
                  editSiteType === "global"
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" /> Global / National
              </button>
            </div>
          </div>
          {editSiteType === "local" && (
            <div className="mt-3">
              <label className="text-sm font-medium text-slate-700">
                Target City <span className="text-red-500">*</span>
              </label>
              <input
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="e.g. Surat, Mumbai"
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
          <div className="mt-3">
            <label className="text-sm font-medium text-slate-700">Business description</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={editBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {editBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editBusy ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={editBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ProjectTabs projectId={projectId} />

      {tab === "keywords" && (
        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                Upload keyword file
                <input type="file" className="hidden" onChange={handleUpload} accept=".csv,.xlsx,.xls,.txt,.json,.pdf,.docx,.xml" />
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
                  {uploadReport.warnings.map((w: string, i: number) => (
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
      )}

      {tab === "links" && (
        <LinksTab projectId={projectId} websiteUrl={project?.websiteUrl || ""} />
      )}

      {tab === "brand voice" && <BrandVoiceTab projectId={projectId} />}
      {tab === "clusters" && <ClustersTab keywords={keywords} />}
      {tab === "content" && <ContentTab projectId={projectId} />}
      {tab === "insights" && <InsightsTab projectId={projectId} />}

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

function ClustersTab({ keywords }: { keywords: Keyword[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, Keyword[]>();
    for (const k of keywords) {
      const name = (k.intent || "ungrouped").toLowerCase();
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(k);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [keywords]);

  if (keywords.length === 0) {
    return <p className="mt-6 text-sm text-slate-600">Add keywords first — clusters form automatically from intent.</p>;
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-slate-600">
        Auto-groups by search intent. {groups.length} cluster(s) from {keywords.length} keyword(s).
      </p>
      {groups.map(([name, list]) => (
        <div key={name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium capitalize text-slate-900">{name}</p>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {list.length}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {list.slice(0, 12).map((k) => (
              <span key={k.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {k.keyword}
              </span>
            ))}
            {list.length > 12 && (
              <span className="px-2 py-1 text-xs text-slate-500">+{list.length - 12} more</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentTab({ projectId }: { projectId: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/contents`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setItems(d.contents);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="mt-6 text-sm text-slate-600">No articles yet. Make content from the Keywords tab.</p>;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Keyword</th>
            <th className="px-4 py-3 font-medium">Words</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Open</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{c.title || "(untitled)"}</td>
              <td className="px-4 py-3 text-slate-600">{c.keyword || "-"}</td>
              <td className="px-4 py-3 text-slate-600">{c.wordCount ?? 0}</td>
              <td className="px-4 py-3 capitalize text-slate-600">{c.status}</td>
              <td className="px-4 py-3">
                <a href={`/contents/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightsTab({ projectId }: { projectId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(`/api/projects/${projectId}/insights`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d.insights);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="mt-6 text-sm text-slate-600">Could not load insights.</p>;
  }

  const cards = [
    { title: "Keywords", total: data.keywords.total, rows: data.keywords.byStatus },
    { title: "Articles", total: data.articles.total, rows: { ...data.articles.byStatus, words: data.articles.words } },
    {
      title: "AI usage",
      total: `${data.ai.runs} runs`,
      rows: { ...data.ai.byStatus, credits: data.ai.creditsUsed, cost_usd: Number(data.ai.costUsd).toFixed(4) },
    },
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{c.title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{c.total}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            {Object.entries(c.rows).map(([k, v]) => (
              <p key={k} className="flex justify-between">
                <span className="capitalize">{k.replace(/_/g, " ")}</span>
                <span className="font-semibold text-slate-800">{String(v)}</span>
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


interface ProjectLink {
  id: number;
  url: string;
  slug?: string | null;
  pageTitle?: string | null;
}

function LinksTab({ projectId, websiteUrl }: { projectId: number; websiteUrl: string }) {
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasted, setPasted] = useState("");
  const [sitemap, setSitemap] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/projects/${projectId}/links`);
      const data = await res.json();
      if (data.success) setLinks(data.links);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function importUrls(body: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ ok: false, text: data.message || "Import failed." });
        return;
      }
      setMsg({ ok: true, text: `Added ${data.added} pages (${data.skipped} skipped as duplicates).` });
      setPasted("");
      load();
    } catch {
      setMsg({ ok: false, text: "Import failed. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(id: number) {
    if (!window.confirm("Remove this page from the library?")) return;
    await fetch(`/api/projects/${projectId}/links?id=${id}`, { method: "DELETE" });
    load();
  }

  async function clearAll() {
    if (!window.confirm("Remove ALL pages from the library?")) return;
    await fetch(`/api/projects/${projectId}/links?all=1`, { method: "DELETE" });
    load();
  }

  const sitemapHint = websiteUrl ? `${websiteUrl.replace(/\/+$/, "")}/sitemap.xml` : "https://yoursite.com/sitemap.xml";

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-slate-600">
        Add your site pages here. New articles will link to them automatically wherever the words appear.
      </p>
      {msg && (
        <p className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-slate-900">Paste page URLs</h3>
          <p className="mt-1 text-xs text-slate-500">One URL per line.</p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={5}
            placeholder={"https://yoursite.com/blog/best-safari\nhttps://yoursite.com/pricing"}
            className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => importUrls({ urls: pasted.split(/[\n,]+/) })}
            disabled={busy || !pasted.trim()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import URLs
          </button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-slate-900">Import from sitemap</h3>
          <p className="mt-1 text-xs text-slate-500">Easiest way to add all pages at once.</p>
          <input
            value={sitemap}
            onChange={(e) => setSitemap(e.target.value)}
            placeholder={sitemapHint}
            className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => importUrls({ sitemapUrl: sitemap.trim() || sitemapHint })}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Import sitemap
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Library ({links.length} pages)</h3>
          {links.length > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-red-600 hover:text-red-700">
              Clear all
            </button>
          )}
        </div>
        {loading ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </p>
        ) : links.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No pages yet. Import some above to enable internal links.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {links.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{l.pageTitle || l.slug || l.url}</p>
                  <p className="truncate text-xs text-slate-500">{l.url}</p>
                </div>
                <button onClick={() => removeLink(l.id)} className="shrink-0 text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

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

function BrandVoiceTab({ projectId }: { projectId: number }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
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
  });

  function joinList(v: string[] | null | undefined): string {
    return Array.isArray(v) ? v.join(", ") : "";
  }

  async function load() {
    try {
      const res = await fetch(`/api/projects/${projectId}/brand-voice`);
      const data = await res.json();
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
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function set<K extends keyof typeof form>(key: K, value: string) {
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

  if (loading) {
    return (
      <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading brand voice...
      </p>
    );
  }

  return (
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
          <input value={form.tone} onChange={(e) => set("tone", e.target.value)} placeholder="simple English" className={inputClass} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Reading level</label>
          <input value={form.readingLevel} onChange={(e) => set("readingLevel", e.target.value)} placeholder="Grade 7" className={inputClass} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Author name</label>
        <input value={form.authorName} onChange={(e) => set("authorName", e.target.value)} placeholder="Ramesh Patel" className={inputClass} />
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Author bio</label>
          <textarea value={form.authorBio} onChange={(e) => set("authorBio", e.target.value)} rows={3} placeholder="10 years writing about Gujarat tourism..." className={inputClass} />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Author credentials</label>
          <textarea value={form.authorCredentials} onChange={(e) => set("authorCredentials", e.target.value)} rows={2} placeholder="Certified naturalist, 200+ safaris guided..." className={inputClass} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Sample of your writing</label>
        <p className="mt-1 text-xs text-slate-500">Paste 2-4 lines you wrote. The AI will copy this style.</p>
        <textarea value={form.sampleWriting} onChange={(e) => set("sampleWriting", e.target.value)} rows={4} placeholder="The Gir forest wakes up before the sun..." className={inputClass} />
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700">Standard call-to-action</label>
          <textarea value={form.standardCta} onChange={(e) => set("standardCta", e.target.value)} rows={2} placeholder="Book your safari at..." className={inputClass} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Words to always use</label>
          <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
          <textarea value={form.mustUseWords} onChange={(e) => set("mustUseWords", e.target.value)} rows={3} className={inputClass} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Banned words (never use)</label>
          <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
          <textarea value={form.bannedWords} onChange={(e) => set("bannedWords", e.target.value)} rows={3} placeholder="leverage, synergy, delve" className={inputClass} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Forbidden topics</label>
          <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
          <textarea value={form.forbiddenTopics} onChange={(e) => set("forbiddenTopics", e.target.value)} rows={3} className={inputClass} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-slate-700">Facts only you know</label>
          <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
          <textarea value={form.uniqueExperienceFacts} onChange={(e) => set("uniqueExperienceFacts", e.target.value)} rows={3} className={inputClass} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Disclaimers</label>
        <p className="mt-1 text-xs text-slate-500">Comma or new line separated.</p>
        <textarea value={form.disclaimers} onChange={(e) => set("disclaimers", e.target.value)} rows={2} className={inputClass} />
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
  );
}