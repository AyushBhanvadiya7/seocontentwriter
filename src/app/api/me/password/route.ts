import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { changePassword } from "@/lib/auth";

// POST /api/me/password — change my password.
// Body: { currentPassword, newPassword }.
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const input = (await request.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const current = input.currentPassword || "";
    const next = input.newPassword || "";
    if (!current || !next) {
      return NextResponse.json({ success: false, message: "Both fields are required." }, { status: 400 });
    }
    if (current === next) {
      return NextResponse.json(
        { success: false, message: "New password must be different." },
        { status: 400 }
      );
    }
    await changePassword(session.userId!, current, next);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Change failed.";
    const status = /unauthorized|log in|sign in|session|auth/i.test(message) ? 401 : 400;
    return NextResponse.json({ success: false, message }, { status });
  }
}
