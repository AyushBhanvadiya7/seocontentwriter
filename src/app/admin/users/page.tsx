"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Users, FileText, Plus, Minus } from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  plan: string;
  credits: number;
  role: string;
  createdAt: string;
  articles: number;
  spent: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("10");
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState("all");
  const [plan, setPlan] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUsers(d.users);
          setGenerations(d.generations);
        } else {
          setError(d.message);
        }
        setLoading(false);
      });
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (plan !== "all" && u.plan !== plan) return false;
      if (quick === "zero-credits" && u.credits !== 0) return false;
      if (quick === "no-articles" && u.articles !== 0) return false;
      if (quick === "buyers" && u.spent <= 0) return false;
      if (quick === "admins" && u.role !== "admin") return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sortBy === "spending") return b.spent - a.spent;
      if (sortBy === "articles") return b.articles - a.articles;
      if (sortBy === "credits") return b.credits - a.credits;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows;
  }, [users, query, quick, plan, sortBy]);

  async function adjustCredits(userId: number, sign: 1 | -1) {
    if (adjustingId !== null) return;
    const delta = Math.trunc(Number(amount)) * sign;
    if (!Number.isFinite(delta) || delta === 0) {
      setAdjustError("Enter a valid amount first.");
      return;
    }
    setAdjustingId(userId);
    setAdjustError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, delta }),
      });
      const data = await res.json();
      if (!data.success) {
        setAdjustError(data.message || "Adjustment failed.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, credits: data.credits } : u)));
    } catch {
      setAdjustError("Adjustment failed. Check your connection and try again.");
    } finally {
      setAdjustingId(null);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
      <p className="text-sm text-slate-600">All users, credits and adjustments.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-5 w-5 text-blue-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{users.length}</p>
          <p className="text-sm text-slate-500">Users</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <FileText className="h-5 w-5 text-blue-600" />
          <p className="mt-2 text-2xl font-semibold text-slate-900">{generations.length}</p>
          <p className="text-sm text-slate-500">Generations</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Amount
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none sm:max-w-xs"
          />
          <select
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All users</option>
            <option value="zero-credits">0 credits</option>
            <option value="no-articles">No articles yet</option>
            <option value="buyers">Buyers (paid)</option>
            <option value="admins">Admins</option>
          </select>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="spending">Top spenders</option>
            <option value="articles">Most articles</option>
            <option value="credits">Most credits</option>
          </select>
          <span className="text-sm text-slate-500">
            {visible.length} of {users.length}
          </span>
        </div>

        {adjustError && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{adjustError}</p>
        )}
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Articles</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {u.name}
                    </Link>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.plan}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.credits}</td>
                  <td className="px-4 py-3">Rs.{u.spent.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">{u.articles}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => adjustCredits(u.id, 1)}
                        disabled={adjustingId !== null}
                        title={`Add ${amount} credits`}
                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {adjustingId === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Add
                      </button>
                      <button
                        onClick={() => adjustCredits(u.id, -1)}
                        disabled={adjustingId !== null}
                        title={`Remove ${amount} credits`}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                      >
                        <Minus className="h-3 w-3" />
                        Sub
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Recent generations</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {generations.map((g: any) => (
                <tr key={g.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{g.id}</td>
                  <td className="px-4 py-3">{g.userId}</td>
                  <td className="px-4 py-3">{g.modelName}</td>
                  <td className="px-4 py-3">{g.tokensIn + g.tokensOut}</td>
                  <td className="px-4 py-3">{g.creditsUsed}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${g.status === "completed" ? "bg-green-100 text-green-700" : g.status === "refunded" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(g.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}