"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

function Dot({ ok }: { ok: boolean }) {
  return <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />;
}

export default function AdminHealthPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/health");
        const d = await res.json();
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load health.");
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">System health</h1>
      <p className="text-sm text-slate-600">Live status. Auto-refreshes every 30s.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Dot ok={data.database.ok} />
            <p className="text-sm font-semibold text-slate-900">Database</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {data.database.ok ? `${data.database.latencyMs}ms` : "DOWN"}
          </p>
          <p className="text-sm text-slate-500">{data.database.ok ? "Connected" : "Not reachable"}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Dot ok={data.email.configured} />
            <p className="text-sm font-semibold text-slate-900">Email (Resend)</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {data.email.configured ? "Configured" : "No key"}
          </p>
          <p className="truncate text-sm text-slate-500" title={data.email.from}>
            {data.email.from}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Dot ok={data.payments.configured} />
            <p className="text-sm font-semibold text-slate-900">Payments (Razorpay)</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {data.payments.configured ? `Mode: ${data.payments.mode}` : "No key"}
          </p>
          <p className="text-sm text-slate-500">
            {data.payments.mode === "live" ? "REAL money!" : "Test mode safe"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Dot ok={true} />
            <p className="text-sm font-semibold text-slate-900">App</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {Math.floor(data.app.uptimeSec / 60)}m {data.app.uptimeSec % 60}s
          </p>
          <p className="text-sm text-slate-500">
            {data.app.node} · {data.app.env}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">AI providers</p>
        <div className="mt-3 space-y-2 text-sm">
          {data.ai.map((p: any) => (
            <div key={p.name} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-1.5">
              <span className="flex items-center gap-2 font-medium text-slate-800">
                <Dot ok={p.configured} /> {p.name}
              </span>
              <span className="text-slate-500">
                {p.configured ? `Key set · ${p.model}` : "No key"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Latest generation errors</p>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.generationErrors.length === 0 && <p className="text-slate-500">None — clean.</p>}
            {data.generationErrors.map((g: any) => (
              <div key={g.id} className="border-b border-slate-100 py-1.5">
                <p className="font-medium text-slate-800">
                  #{g.id} {g.modelName || "AI"} · {new Date(g.createdAt).toLocaleString()}
                </p>
                {g.errorMessage && <p className="text-xs text-red-600">{g.errorMessage}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Failed admin OTP logins</p>
          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto text-sm">
            {data.failedOtpLogins.length === 0 && <p className="text-slate-500">None — clean.</p>}
            {data.failedOtpLogins.map((l: any) => (
              <div key={l.id} className="border-b border-slate-100 py-1.5">
                <p className="font-medium text-slate-800">{l.adminEmail}</p>
                <p className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}