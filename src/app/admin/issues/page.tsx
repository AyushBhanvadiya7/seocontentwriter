"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const rs = (paise: number) => "Rs." + Math.round(paise / 100).toLocaleString("en-IN");

export default function AdminIssuesPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/issues");
        const d = await res.json();
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load issues.");
      } catch {
        if (alive) setError("Connection problem. Please try again.");
      }
    }
    load();
    const timer = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

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

  const stuck = data.stuckOrders.length;
  const failed = data.failedOrders.length + data.badGenerations.length;
  const allClear = stuck === 0 && failed === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Issues</h1>
      <p className="text-sm text-slate-600">Broken things first. Auto-refreshes every 30s.</p>

      {allClear ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>All clear — no stuck payments, no failed orders, no failed generations.</span>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            {stuck} stuck payment{stuck === 1 ? "" : "s"} · {failed} failed item{failed === 1 ? "" : "s"}. Fix
            stuck payments first — the user paid but got no credits.
          </span>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-red-700">
          Paid but no credits ({data.stuckOrders.length})
        </h2>
        {data.stuckOrders.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">None. Every paid order delivered credits.</p>
        ) : (
          <div className="mt-3 space-y-1.5 text-sm">
            {data.stuckOrders.map((o: any) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2">
                <div>
                  <p className="font-medium text-slate-900">
                    Order #{o.id} · {rs(o.amount)} · {o.plan}
                  </p>
                  <p className="text-xs text-slate-500">
                    {o.user.email} · {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/admin/users/${o.userId}`}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Open user & fix
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Failed orders ({data.failedOrders.length})</h2>
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-sm">
            {data.failedOrders.length === 0 && <p className="text-slate-500">None.</p>}
            {data.failedOrders.map((o: any) => (
              <div key={o.id} className="border-b border-slate-100 py-1.5">
                <p className="font-medium text-slate-800">Order #{o.id} · {rs(o.amount)} · {o.plan}</p>
                <p className="text-xs text-slate-500">
                  {o.user.email} · {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Pending orders ({data.pendingOrders.length})</h2>
          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto text-sm">
            {data.pendingOrders.length === 0 && <p className="text-slate-500">None.</p>}
            {data.pendingOrders.map((o: any) => (
              <div key={o.id} className="border-b border-slate-100 py-1.5">
                <p className="font-medium text-slate-800">Order #{o.id} · {rs(o.amount)} · {o.plan}</p>
                <p className="text-xs text-slate-500">
                  {o.user.email} · {new Date(o.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Failed / refunded generations ({data.badGenerations.length})
        </h2>
        <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto text-sm">
          {data.badGenerations.length === 0 && <p className="text-slate-500">None.</p>}
          {data.badGenerations.map((g: any) => (
            <div key={g.id} className="border-b border-slate-100 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-800">
                  #{g.id} {g.modelName || "AI"} · {g.user.email}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    g.status === "refunded" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {g.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {(g.tokensIn || 0) + (g.tokensOut || 0)} tokens · {new Date(g.createdAt).toLocaleString()}
              </p>
              {g.errorMessage && <p className="text-xs text-red-600">{g.errorMessage}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Live queue ({data.liveNow.length})</h2>
        {data.liveNow.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Idle — nothing generating right now.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {data.liveNow.map((g: any) => (
              <span
                key={g.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />#{g.id} {g.status} ·{" "}
                {g.user.email}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}