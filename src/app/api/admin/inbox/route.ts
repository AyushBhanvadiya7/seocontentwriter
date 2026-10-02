import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, contactMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { desc, eq, inArray } from "drizzle-orm";

// GET /api/admin/inbox — contact + feedback messages, newest first.
export async function GET() {
  try {
    await requireAdmin();
    const list = await db.query.contactMessages.findMany({
      orderBy: desc(contactMessages.createdAt),
      limit: 200,
    });
    const emails = Array.from(new Set(list.map((m) => m.email.toLowerCase())));
    const userRows =
      emails.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.email, emails),
            columns: { id: true, email: true },
          })
        : [];
    const idByEmail = new Map(userRows.map((u) => [u.email.toLowerCase(), u.id]));
    return NextResponse.json({
      success: true,
      messages: list.map((m) => ({ ...m, userId: idByEmail.get(m.email.toLowerCase()) || null })),
      openCount: list.filter((m) => m.status === "open").length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// PATCH /api/admin/inbox — { id, status: "open" | "resolved" }.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);
    const status = String(body.status || "");
    if (!Number.isFinite(id) || (status !== "open" && status !== "resolved")) {
      return NextResponse.json({ success: false, message: "Invalid id or status." }, { status: 400 });
    }
    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
    await logAudit({
      adminId: session.userId ?? null,
      adminEmail: session.email ?? "unknown",
      action: status === "resolved" ? "inbox.resolve" : "inbox.reopen",
      targetType: "contact_message",
      targetId: id,
      details: {},
    });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
