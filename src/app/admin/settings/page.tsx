"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setValues(d.settings);
        else setError(d.message || "Failed to load settings.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function save(key: string) {
    if (!values || busy) return;
    setBusy(key);
    setSaved("");
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: values[key] ?? "" }),
      });
      const d = await res.json();
      if (d.success) setSaved(key);
      else setError(d.message || "Save failed.");
    } catch {
      setError("Connection problem. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function set(key: string, value: string) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved("");
  }

  if (error && !values) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-slate-700">{error}</p>
      </div>
    );
  }

  if (!values) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-600">Site controls. Changes apply immediately.</p>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-900">Free trial credits</p>
          <p className="text-sm text-slate-500">Credits every new signup gets. Applies to the next registration.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={1000}
              value={values.free_credits ?? "10"}
              onChange={(e) => set("free_credits", e.target.value)}
              className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => save("free_credits")}
              disabled={busy !== null}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {busy === "free_credits" ? "Saving..." : "Save"}
            </button>
            {saved === "free_credits" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-900">New registrations</p>
          <p className="text-sm text-slate-500">Pause signups during maintenance. Existing users keep working.</p>
          <div className="mt-3 flex items-center gap-2">
            {(["yes", "no"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => set("signups_open", opt)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  (values.signups_open ?? "yes") === opt
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {opt === "yes" ? "Open" : "Paused"}
              </button>
            ))}
            <button
              onClick={() => save("signups_open")}
              disabled={busy !== null}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {busy === "signups_open" ? "Saving..." : "Save"}
            </button>
            {saved === "signups_open" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-900">Support email</p>
          <p className="text-sm text-slate-500">Where contact-form mails go. Empty means the default address.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="email"
              placeholder="you@example.com"
              value={values.support_email ?? ""}
              onChange={(e) => set("support_email", e.target.value)}
              className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => save("support_email")}
              disabled={busy !== null}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {busy === "support_email" ? "Saving..." : "Save"}
            </button>
            {saved === "support_email" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}