import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupportEmail } from "@/lib/site-settings";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";

export const runtime = "nodejs";

const ISSUES = ["support", "billing", "feedback", "other"] as const;

// POST /api/contact — public. Validates, rate-limits, saves to DB, emails support.
// Without RESEND_API_KEY the message is logged to the server console
// (visible in the terminal / Vercel logs) so nothing is ever lost.
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forward-for")?.split(",")[0]?.trim() || "unknown";
    const gate = checkRateLimit(`contact:${ip}`, 5, 60_000);
    if (!gate.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many messages. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const issue = typeof body.issue === "string" ? body.issue.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ success: false, message: "Please enter your name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }
    if (!(ISSUES as readonly string[]).includes(issue)) {
      return NextResponse.json({ success: false, message: "Please choose an issue type." }, { status: 400 });
    }
    if (message.length < 10 || message.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Message should be 10-2000 characters." },
        { status: 400 }
      );
    }

    const subject = `[Contact: ${issue}] ${name}`;
    const text = `From: ${name} <${email}>\nIssue: ${issue}\n\n${message}`;
    const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; color: #1e293b;">
      <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p><strong>Issue:</strong> ${escapeHtml(issue)}</p>
      <hr /><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    </div>`;

    const supportTo = await getSupportEmail();
    const mailed = await sendEmail(supportTo, subject, html, text);
    console.log(`[contact] issue=${issue} from=${email} mailed=${mailed} message=${message.slice(0, 120)}`);

    // Save for the admin inbox. A DB hiccup must never break the public form.
    try {
      await db.insert(contactMessages).values({ name, email, issue, message });
    } catch (dbError) {
      console.error("[contact:db-failed]", dbError);
    }

    return NextResponse.json({ success: true, mailed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
