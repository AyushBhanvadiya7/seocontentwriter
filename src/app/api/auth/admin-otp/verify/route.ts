import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { verifyAdminOtp } from "@/lib/admin-otp";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

// POST /api/auth/admin-otp/verify — completes an admin login (step 2 of 2FA).
// Needs a pendingAdminId session from step 1 (password) plus the emailed code.
export async function POST(request: NextRequest) {
  const gate = checkRateLimit(`admin-otp:${clientIp(request)}`, 10, 60_000);
  if (!gate.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many tries. Wait a minute and try again." },
      { status: 429 }
    );
  }
  try {
    const session = await getSession();
    const pendingId = session.pendingAdminId;
    if (!pendingId) {
      return NextResponse.json(
        { success: false, message: "No OTP pending. Please log in again." },
        { status: 400 }
      );
    }
    const body = await request.json();
    const data = otpSchema.parse(body);
    const user = await db.query.users.findFirst({ where: eq(users.id, pendingId) });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found. Please log in again." },
        { status: 400 }
      );
    }
    const ok = await verifyAdminOtp(pendingId, data.code);
    if (!ok) {
      await logAudit({
        adminId: pendingId,
        adminEmail: user.email,
        action: "admin.otp.failed",
        targetType: "user",
        targetId: pendingId,
        details: {},
      });
      return NextResponse.json(
        { success: false, message: "Wrong or expired code. Try again." },
        { status: 401 }
      );
    }
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Account is not an admin." }, { status: 403 });
    }
    session.userId = user.id;
    session.email = user.email;
    session.role = "admin";
    session.pendingAdminId = undefined;
    session.isLoggedIn = true;
    await session.save();
    await logAudit({
      adminId: user.id,
      adminEmail: user.email,
      action: "admin.login.otp",
      targetType: "user",
      targetId: user.id,
      details: {},
    });
    return NextResponse.json({ success: true });
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
