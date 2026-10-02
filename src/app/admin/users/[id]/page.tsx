"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function AdminUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load user.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  async function refresh() {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const d = await res.json();
      if (d.success) setData(d);
    } catch {
      // Keep old data when a background refresh fails.
    }
  }

  async function runAction(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.success) {
        setMsg(d.message || "Action failed.");
        return;
      }
      if (d.deleted) {
        router.push("/admin/users");
        return;
      }
      setMsg("Done.");
      await refresh();
    } catch {
      setMsg("Action failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

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

  const u = data.user;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{u.name}</h1>
          <p className="text-sm text-slate-500">
            {u.email} · ID #{u.id}
          </p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
            u.status === "suspended" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {u.status === "suspended" ? "Suspended" : "Active"}
        </span>
      </div>

      {msg && (
        <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">{msg}</p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Basic info</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="font-medium text-slate-900">{u.phone || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-medium capitalize text-slate-900">{u.plan}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd className="font-medium capitalize text-slate-900">{u.role}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Credits</dt><dd className="font-medium text-slate-900">{u.credits}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email verified</dt><dd className="font-medium text-slate-900">{u.emailVerifiedAt ? "Yes" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Signed up</dt><dd className="font-medium text-slate-900">{new Date(u.createdAt).toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Last login</dt><dd className="font-medium text-slate-900">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-"}</dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Admin actions</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="Amount"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-24"
            />
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (required, goes to audit)"
              className="w-full flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => runAction({ action: "adjust", delta: Math.trunc(Number(amount)), reason })}
              disabled={busy}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Add credits
            </button>
            <button
              onClick={() => runAction({ action: "adjust", delta: -Math.trunc(Number(amount)), reason })}
              disabled={busy}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Remove credits
            </button>
            <button
              onClick={() => runAction({ action: "status", status: u.status === "suspended" ? "active" : "suspended" })}
              disabled={busy}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {u.status === "suspended" ? "Un-suspend" : "Suspend"}
            </button>
            <button
              onClick={() => runAction({ action: "role", role: u.role === "admin" ? "user" : "admin" })}
              disabled={busy}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {u.role === "admin" ? "Remove admin" : "Make admin"}
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${u.email} and ALL their data? This cannot be undone.`)) {
                  runAction({ action: "delete" });
                }
              }}
              disabled={busy}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Credits ledger</h2>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.ledger.length === 0 && <p className="text-slate-500">No entries yet.</p>}
            {data.ledger.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <div>
                  <p className="text-slate-800">{l.reason}</p>
                  <p className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-semibold ${l.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {l.change >= 0 ? "+" : ""}{l.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Payments · Lifetime Rs.{Number(data.lifetimeValue).toLocaleString("en-IN")}
          </h2>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
            {data.orders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5">
                <div>
                  <p className="capitalize text-slate-800">{o.plan} · Rs.{(o.amount / 100).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.status === "paid" ? "bg-green-100 text-green-700" : o.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Projects ({data.projects.length})</h2>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.projects.length === 0 && <p className="text-slate-500">No projects yet.</p>}
            {data.projects.map((p: any) => (
              <div key={p.id} className="border-b border-slate-100 py-1.5">
                <p className="font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">{p.keywordCount} keywords · {p.articleCount} articles</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Generations ({data.generations.length})</h2>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.generations.length === 0 && <p className="text-slate-500">No generations yet.</p>}
            {data.generations.map((g: any) => (
              <div key={g.id} className="border-b border-slate-100 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-800">#{g.id} {g.modelName || "AI"}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.status === "completed" ? "bg-green-100 text-green-700" : g.status === "failed" || g.status === "refunded" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                    {g.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {(g.tokensIn || 0) + (g.tokensOut || 0)} tokens · {g.creditsUsed} credits · {new Date(g.createdAt).toLocaleString()}
                </p>
                {g.errorMessage && <p className="text-xs text-red-600">{g.errorMessage}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Activity timeline</h2>
        <div className="mt-3 space-y-1.5 text-sm">
          {data.timeline.map((t: any, i: number) => (
            <div key={i} className="flex gap-3 border-b border-slate-100 py-1.5">
              <span className="w-40 shrink-0 text-xs text-slate-500">{new Date(t.at).toLocaleString()}</span>
              <span className="text-slate-800">{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}