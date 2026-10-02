"use client";

import { useState } from "react";

const ISSUES = [
  { value: "support", label: "Support — login, credits, articles" },
  { value: "billing", label: "Billing — payments, invoices, refunds" },
  { value: "feedback", label: "Feedback — ideas and suggestions" },
  { value: "other", label: "Other" },
];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("support");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, issue, message }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Could not send. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not send. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none";

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
        <h2 className="font-semibold text-green-900">Message received.</h2>
        <p className="mt-1 text-sm text-green-800">
          We reply within 1 business day (Monday-Saturday, India time).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Send a message</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder="Ramesh Patel"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email (we reply here)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Issue type</label>
        <select value={issue} onChange={(e) => setIssue(e.target.value)} className={inputClass}>
          {ISSUES.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Payment done on 20 Sept but credits not added..."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-slate-500">{message.length}/2000</p>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}