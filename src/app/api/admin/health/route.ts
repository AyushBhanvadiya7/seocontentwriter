import { NextResponse } from "next/server";
import { db } from "@/db";
import { generations, auditLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { desc, eq, sql } from "drizzle-orm";

// GET /api/admin/health — live system status. Secret VALUES are never returned,
// only yes/no plus harmless prefixes.
export async function GET() {
  try {
    await requireAdmin();

    const dbStart = Date.now();
    let dbOk = true;
    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbOk = false;
    }

    const razorId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

    const [genErrors, otpFails] = await Promise.all([
      db.query.generations.findMany({
        where: eq(generations.status, "failed"),
        orderBy: desc(generations.createdAt),
        limit: 10,
        columns: { id: true, modelName: true, errorMessage: true, createdAt: true },
      }),
      db.query.auditLogs.findMany({
        where: eq(auditLogs.action, "admin.otp.failed"),
        orderBy: desc(auditLogs.createdAt),
        limit: 10,
        columns: { id: true, adminEmail: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      database: { ok: dbOk, latencyMs: Date.now() - dbStart },
      ai: [
        {
          name: "AIMLAPI",
          configured: Boolean(process.env.AIMLAPI_KEY),
          model: process.env.AIMLAPI_MODEL || "default",
        },
        {
          name: "Gemini",
          configured: Boolean(process.env.GEMINI_API_KEY),
          model: process.env.GEMINI_MODEL || "default",
        },
        {
          name: "OpenAI",
          configured: Boolean(process.env.OPENAI_API_KEY),
          model: process.env.OPENAI_MODEL || "default",
        },
      ],
      email: {
        configured: Boolean(process.env.RESEND_API_KEY),
        from: process.env.EMAIL_FROM || "onboarding@resend.dev (default)",
      },
      payments: {
        configured: Boolean(razorId),
        mode: razorId.startsWith("rzp_live")
          ? "live"
          : razorId.startsWith("rzp_test")
            ? "test"
            : "unknown",
      },
      app: {
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
        env: process.env.NODE_ENV || "development",
      },
      generationErrors: genErrors,
      failedOtpLogins: otpFails,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
