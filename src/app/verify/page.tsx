"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

function VerifyBox() {
  const params = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "bad">("loading");

  useEffect(() => {
    const token = params.get("token") || "";
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => setState(d.success ? "ok" : "bad"))
      .catch(() => setState("bad"));
  }, [params]);

  if (state === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Email verified</h1>
        <p className="mt-1 text-sm text-slate-600">Your email is confirmed. Welcome aboard!</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Link invalid or expired</h1>
      <p className="mt-1 text-sm text-slate-600">Verify links last 24 hours. Register again for a fresh link.</p>
      <Link
        href="/register"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to register
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyBox />
    </Suspense>
  );
}