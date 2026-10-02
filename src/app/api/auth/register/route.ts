import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { createEmailVerifyToken } from "@/lib/email-verify";
import { signupsOpen } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  terms: z.boolean().refine((v) => v === true, { message: "Please accept the Terms to continue." }),
});

export async function POST(request: NextRequest) {
  // Spam guard: 5 signups per minute per IP.
  const gate = checkRateLimit(`register:${clientIp(request)}`, 5, 60_000);
  if (!gate.allowed) {
    return NextResponse.json({ success: false, message: "Too many signups. Wait a minute and try again." }, { status: 429 });
  }
  try {
    if (!(await signupsOpen())) {
      return NextResponse.json({ success: false, message: "Registrations are paused right now. Please try again later." }, { status: 403 });
    }
    const body = await request.json();
    const data = registerSchema.parse(body);
    const user = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
    });
    // Welcome mail (never blocks signup — sendEmail never throws).
    const mail = welcomeEmail(user.name || "there");
    await sendEmail(user.email, mail.subject, mail.html, mail.text);
    // Email verification: real mail when a key exists; until then the
    // link is printed to the server terminal (same honesty as contact).
    const token = createEmailVerifyToken(user.id);
    const base = getSiteUrl();
    const link = `${base}/verify?token=${token}`;
    // Real mail when possible (never throws). Plus the terminal link in
    // dev, so testing never needs an inbox.
    await sendEmail(
      user.email,
      "Verify your email address",
      `<p>Hi there,</p><p>Please verify your email by clicking here: <a href="${link}">Verify my email</a></p><p>This link expires in 24 hours.</p>`,
      `Hi there, verify your email here (24 hours): ${link}`
    );
    if (process.env.NODE_ENV !== "production") {
      console.log(`[verify-email] ${user.email} -> ${link}`);
    }
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
