"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

export default function AdminInboxPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/inbox")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load inbox.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function setStatus(id: number, status: string) {
    if (busy !== null) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/inbox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await res.json();
      if (d.success) {
        setData((prev: any) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((m: any) => (m.id === id ? { ...m, status } : m)),
                openCount:
                  status === "resolved" ? prev.openCount - 1 : prev.openCount + 1,
              }
            : prev
        );
      }
    } catch {
      // Keep old state; admin can retry.
    } finally {
      setBusy(null);
    }
  }

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.messages;
    return data.messages.filter((m: any) => m.status === filter);
  }, [data, filter]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-slate-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Inbox</h1>
      <p className="text-sm text-slate-600">
        {data.openCount} open · contact form + feedback button messages
      </p>

      <div className="mt-4 flex gap-2">
        {["open", "resolved", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Nothing here. New messages appear automatically.
          </p>
        )}
        {visible.map((m: any) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">
                  {m.name}{" "}
                  {m.userId ? (
                    <Link
                      href={`/admin/users/${m.userId}`}
                      className="text-sm font-normal text-blue-600 hover:underline"
                    >
                      {m.email}
                    </Link>
                  ) : (
                    <span className="text-sm font-normal text-slate-500">{m.email}</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                  {m.issue}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    m.status === "open" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{m.message}</p>
            <div className="mt-3">
              <button
                onClick={() => setStatus(m.id, m.status === "open" ? "resolved" : "open")}
                disabled={busy !== null}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {busy === m.id ? "Saving..." : m.status === "open" ? "Mark resolved" : "Reopen"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}