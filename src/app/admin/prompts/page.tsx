"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    const res = await fetch("/api/admin/prompts");
    const data = await res.json();
    if (data.success) {
      setPrompts(data.prompts.filter((p: any) => p.isActive));
    } else {
      setError(data.message);
    }
    setLoading(false);
  }

  function startEdit(p: any) {
    setEditing(p.id);
    setDraft(p.body);
  }

  async function savePrompt(p: any) {
    setMessage("");
    const res = await fetch("/api/admin/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, body: draft }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage("Prompt updated to version " + data.prompt.version);
      setEditing(null);
      loadPrompts();
    } else {
      setError(data.message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-slate-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Prompt editor</h1>
      <p className="text-sm text-slate-600">Edit AI prompts without redeploying. New versions are tracked.</p>

      {message && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{message}</p>}

      <div className="mt-6 space-y-4">
        {prompts.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{p.key}</h3>
                <p className="text-xs text-slate-500">Stage: {p.stage} · Version {p.version}</p>
              </div>
              {editing !== p.id ? (
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => savePrompt(p)}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
              )}
            </div>
            {editing === p.id ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              />
            ) : (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {p.body}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
