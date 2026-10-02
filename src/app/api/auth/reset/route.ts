import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";

// POST /api/auth/reset  { token, password }
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json().catch(() => ({}));
    const cleanPassword = String(password || "");

    if (cleanPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const userId = verifyResetToken(String(token || ""));
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "This reset link is invalid or expired. Ask for a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(cleanPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Password changed. Please log in." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
