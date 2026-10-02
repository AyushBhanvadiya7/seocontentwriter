import * as Sentry from "@sentry/nextjs";

// Edge errors (middleware) land in Sentry.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
