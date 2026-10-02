import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyEmailToken } from "@/lib/email-verify";

// POST /api/auth/verify — confirms an email address.
// Body: { token }. Sets emailVerifiedAt. Safe to call twice.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = verifyEmailToken(body.token);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "This link is invalid or has expired. Register again for a fresh link." },
        { status: 400 }
      );
    }
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
