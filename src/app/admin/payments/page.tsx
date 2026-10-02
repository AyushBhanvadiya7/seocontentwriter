"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

const rs = (paise: number) => "Rs." + Math.round(paise / 100).toLocaleString("en-IN");
const inr = (n: number) => "Rs." + Math.round(n).toLocaleString("en-IN");

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.message || "Failed to load payments.");
      })
      .catch(() => {
        if (alive) setError("Connection problem. Please try again.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    if (status === "all") return data.orders;
    return data.orders.filter((o: any) => o.status === status);
  }, [data, status]);

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
      <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
      <p className="text-sm text-slate-600">
        {inr(data.revenue.all)} all-time · {inr(data.revenue.month)} this month
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Today</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{inr(data.revenue.today)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">This week</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{inr(data.revenue.week)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">This month</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{inr(data.revenue.month)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">All-time</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{inr(data.revenue.all)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Sales by plan (paid)</p>
        {data.planSales.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No sales yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {data.planSales.map((p: any) => (
              <span
                key={p.plan}
                className="rounded-full bg-green-100 px-3 py-1.5 font-medium capitalize text-green-700"
              >
                {p.plan}: {p.count} × {inr(p.revenue)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <span className="text-sm text-slate-500">{visible.length} orders</span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gateway ref</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            )}
            {visible.map((o: any) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium capitalize text-slate-900">#{o.id} {o.plan}</p>
                  {o.gstin && <p className="text-xs text-slate-500">GSTIN: {o.gstin}</p>}
                </td>
                <td className="px-4 py-3 text-xs">
                  {o.user ? (
                    <Link
                      href={`/admin/users/${o.userId}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {o.user.email}
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">{rs(o.amount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      o.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : o.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : o.status === "refunded"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-xs text-slate-500" title={o.gatewayRef || ""}>
                  {o.gatewayRef || "-"}
                </td>
                <td className="px-4 py-3 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}