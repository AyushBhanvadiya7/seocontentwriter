"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, X } from "lucide-react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setName((v) => v || d.user.name || "");
          setEmail((v) => v || d.user.email || "");
        }
      })
      .catch(() => {});
  }, [open ]);

  async function send() {
    if (busy) return;
    setError(null);
    if (message.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, issue: "feedback", message }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Send failed.");
        return;
      }
      setDone(true);
      setMessage("");
    } catch {
      setError("Send failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className=" bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Send feedback</h3>
            <button onClick={() => setOpen(false)} aria-label="Close feedback">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          {done ? (
            <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Thanks! Your feedback was sent.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What should we improve? (min 10 characters)"
                rows={4}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={send}
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Sending..." : "Send feedback"}
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => {
          setOpen(!open);
          setDone(false);
          setError(null);
        }}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        <MessageSquare className="h-4 w-4" /> Feedback
      </button>
    </div>
  );
}