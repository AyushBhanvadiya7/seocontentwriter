import * as Sentry from "@sentry/nextjs";

// Browser-side errors (button clicks, page crashes) land in Sentry.
// This file is loaded automatically by Next.js — no import needed anywhere.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
