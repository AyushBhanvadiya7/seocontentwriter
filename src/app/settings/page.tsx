"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound, Loader2, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.user);
        setLoading(false);
      });
  }, []);

  async function changePw() {
    if (pwBusy) return;
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ ok: false, text: "Fill all three fields." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!data.success) {
        setPwMsg({ ok: false, text: data.message || "Change failed." });
        return;
      }
      setPwMsg({ ok: true, text: "Password changed. Use it next time you log in." });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch {
      setPwMsg({ ok: false, text: "Change failed. Check your connection and try again." });
    } finally {
      setPwBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteBusy || deleteText !== "DELETE") return;
    if (!window.confirm("Last warning: this erases your account and ALL your data forever. Continue?")) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.message || "Delete failed.");
        return;
      }
      window.location.href = "/register";
    } catch {
      setDeleteError("Delete failed. Check your connection and try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-600">Please log in to view settings.</p>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="text-sm text-slate-600">Profile, credits and brand voice.</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium text-slate-900">{user.name}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-medium text-slate-900 capitalize">{user.plan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Credits</dt>
            <dd className="font-medium text-slate-900">{user.credits}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <KeyRound className="h-5 w-5 text-slate-400" /> Change password
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">New password (min 8)</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {pwMsg && (
            <p className={`rounded-lg px-4 py-2 text-sm ${pwMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {pwMsg.text}
            </p>
          )}
          <button
            onClick={changePw}
            disabled={pwBusy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pwBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            {pwBusy ? "Changing..." : "Change password"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Credits & billing</h2>
        <p className="mt-2 text-sm text-slate-600">
          Top up credits on the{" "}
          <Link href="/billing" className="font-medium text-blue-600 hover:underline">
            billing page
          </Link>{" "}
          (UPI, cards and netbanking via Razorpay) or compare{" "}
          <Link href="/pricing" className="font-medium text-blue-600 hover:underline">
            plans
          </Link>
          . Paid credits never expire.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-red-700">
          <Trash2 className="h-5 w-5" /> Delete account
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          This erases your account, projects, articles, keywords and orders — forever. There is no undo.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700">Type DELETE to confirm</label>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className={inputClass}
            />
          </div>
          <button
            onClick={deleteAccount}
            disabled={deleteBusy || deleteText !== "DELETE"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleteBusy ? "Deleting..." : "Delete my account"}
          </button>
        </div>
        {deleteError && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{deleteError}</p>
        )}
      </div>
    </div>
  );
}