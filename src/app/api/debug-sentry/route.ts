import { NextResponse } from "next/server";

// GET /api/debug-sentry — throws a test error so you can verify Sentry.
// Works ONLY on your computer (development). On the live site it answers 404.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }
  throw new Error("Sentry test error — safe to ignore.");
}
