import { NextResponse } from "next/server";
import { getCurrentUser, logoutUser } from "@/lib/auth";
import { requireAuth } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });
  }
  return NextResponse.json({ success: true, user });
}

// DELETE /api/me — deletes my account and everything in it
// (projects, articles, orders...). Cannot be undone.
export async function DELETE() {
  try {
    const session = await requireAuth();
    await db.delete(users).where(eq(users.id, session.userId!));
    await logoutUser();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    const status = /unauthorized|log in|sign in|session|auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
