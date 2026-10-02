"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Receipt, Coins } from "lucide-react";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRupees(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString("en-IN")}`;
}

function statusStyle(status: string): string {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function BillingPage() {
  const [data, setData] = useState<{ orders: any[]; ledger: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/history")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError(d.message || "Could not load billing history.");
      })
      .catch(() => setError("Could not load billing history. Check your connection."));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600">{error}</p>
        <Link href="/login" className="mt-3 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Go to login
        </Link>
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        <Receipt className="h-6 w-6 text-blue-600" /> Billing
      </h1>
      <p className="mt-1 text-sm text-slate-600">Your purchases and every credit movement, newest first.</p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Purchases</h2>
      {data.orders.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600">No purchases yet.</p>
          <Link href="/pricing" className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline">
            View plans
          </Link>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Credits</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-700">{formatDate(o.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{o.planName}</td>
                  <td className="px-4 py-3 text-slate-700">+{o.credits}</td>
                  <td className="px-4 py-3 text-slate-700">{formatRupees(o.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "paid" ? (
                      <Link href={`/billing/invoice/${o.id}`} className="font-semibold text-blue-600 hover:underline">
                        Invoice
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Coins className="h-5 w-5 text-blue-600" /> Credit history
      </h2>
      {data.ledger.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No credit movements yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-700">{formatDate(l.date)}</td>
                  <td className={`px-4 py-3 font-semibold ${l.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {l.change >= 0 ? `+${l.change}` : l.change}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{l.reason}</td>
                  <td className="px-4 py-3 text-slate-700">{l.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}