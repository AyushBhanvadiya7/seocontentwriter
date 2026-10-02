"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last-resort catcher: replaces the whole page when even the layout crashes.
// Uses inline styles because global CSS is not loaded here.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "Arial, sans-serif", background: "#f8fafc", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "80px auto", padding: 32, background: "#fff", borderRadius: 12, textAlign: "center" }}>
          <h2 style={{ color: "#0f172a" }}>Something went wrong</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>Our team has been notified. Please try again.</p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 12, background: "#2563eb", color: "#fff", border: 0, padding: "10px 24px", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}