"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileText, IndianRupee, Loader2, Users, Zap } from "lucide-react";

interface OverviewStats {
  users: { total: number; today: number; week: number };
  articles: { all: number; today: number; week: number; month: number };
  generatingNow: number;
  revenue: { today: number; month: number; all: number };
  credits: { freeGiven: number; paidSold: number };
  failed: { count: number; pct: number };
  aiCost: { today: number; month: number };
  series: { date: string; signups: number; articles: number }[];
}

const inr = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/overview");
        const data = await res.json();
        if (!alive) return;
        if (data.success) {
          setStats(data.stats);
          setUpdatedAt(new Date());
        } else {
          setError(data.message || "Failed to load overview.");
        }
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

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const maxBar = Math.max(1, ...stats.series.map((d) => Math.max(d.signups, d.articles)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-600">Everything, all-time and right now.</p>
        </div>
        <p className="text-xs text-slate-500">
          {stats.generatingNow > 0 ? (
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              {stats.generatingNow} generating now
            </span>
          ) : (
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Idle — nothing generating
            </span>
          )}
          Auto-refreshes every 30s
          {updatedAt ? ` · Updated ${updatedAt.toLocaleTimeString()}` : ""}
        </p>
      </div>

      {stats.failed.pct >= 20 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            High failure rate: {stats.failed.pct}% of generations failed or were refunded (
            {stats.failed.count}). Check the generations monitor.
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-5 w-5 text-blue-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.users.total}</p>
          <p className="text-sm text-slate-500">Total users</p>
          <p className="mt-1 text-xs text-slate-500">
            +{stats.users.today} today · +{stats.users.week} this week
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <FileText className="h-5 w-5 text-blue-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.articles.all}</p>
          <p className="text-sm text-slate-500">Articles made</p>
          <p className="mt-1 text-xs text-slate-500">
            +{stats.articles.today} today · +{stats.articles.week} week · +{stats.articles.month} month
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <IndianRupee className="h-5 w-5 text-green-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{inr(stats.revenue.all)}</p>
          <p className="text-sm text-slate-500">Revenue (all-time)</p>
          <p className="mt-1 text-xs text-slate-500">
            {inr(stats.revenue.today)} today · {inr(stats.revenue.month)} month
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Zap className="h-5 w-5 text-amber-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{inr(stats.aiCost.month)}</p>
          <p className="text-sm text-slate-500">AI cost (month, approx)</p>
          <p className="mt-1 text-xs text-slate-500">{inr(stats.aiCost.today)} today</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Credits: free vs paid</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {stats.credits.freeGiven} <span className="text-sm font-normal text-slate-500">free</span>
            {" / "}
            {stats.credits.paidSold} <span className="text-sm font-normal text-slate-500">sold</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Failed / refunded</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {stats.failed.count}{" "}
            <span className="text-sm font-normal text-slate-500">({stats.failed.pct}%)</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-700">Shortcuts</p>
          <div className="mt-2 flex gap-2">
            <Link
              href="/admin/users"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Users
            </Link>
            <Link
              href="/admin/prompts"
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Prompts
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Last 30 days</p>
          <p className="flex gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Signups
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" /> Articles
            </span>
          </p>
        </div>
        <div className="mt-4 flex h-40 items-end gap-1 overflow-x-auto">
          {stats.series.map((d) => (
            <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-0.5" title={`${d.date}: ${d.signups} signups, ${d.articles} articles`}>
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                <div
                  className="w-2 rounded-t bg-blue-600 sm:w-3"
                  style={{ height: `${Math.max(2, (d.signups / maxBar) * 100)}%` }}
                />
                <div
                  className="w-2 rounded-t bg-sky-300 sm:w-3"
                  style={{ height: `${Math.max(2, (d.articles / maxBar) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400">{d.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}