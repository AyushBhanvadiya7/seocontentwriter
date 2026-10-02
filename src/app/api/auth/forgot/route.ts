import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createResetToken } from "@/lib/password-reset";
import { sendEmail, resetEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/auth/forgot  { email }
// Always answers success — never reveals whether an email is registered.
export async function POST(request: Request) {
  // Spam guard: 3 reset mails per minute per IP (email costs money).
  const gate = checkRateLimit(`forgot:${clientIp(request)}`, 3, 60_000);
  if (!gate.allowed) {
    return NextResponse.json({ success: false, message: "Too many tries. Wait a minute and try again." }, { status: 429 });
  }
  const done = { success: true, message: "If that email is registered, a reset link is on its way." };
  try {
    const { email } = await request.json().catch(() => ({}));
    const clean = String(email || "").trim().toLowerCase();
    if (!clean) return NextResponse.json(done);

    const user = await db.query.users.findFirst({ where: eq(users.email, clean) });
    if (!user) return NextResponse.json(done);

    const token = createResetToken(user.id);
    const link = `${new URL(request.url).origin}/reset-password?token=${token}`;
    const mail = resetEmail(user.name || "there", link);
    await sendEmail(user.email, mail.subject, mail.html, mail.text);

    return NextResponse.json(done);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
