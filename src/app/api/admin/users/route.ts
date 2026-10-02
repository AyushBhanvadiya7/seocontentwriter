import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, generations, creditsLedger, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { count, desc, eq, sum } from "drizzle-orm";

// GET /api/admin/users — every user enriched with articles made + total spent (Rs).
// Filtering/sorting happens on the page (fast enough up to a few thousand users;
// server-side paging can come later at scale).
export async function GET() {
  try {
    await requireAdmin();
    const list = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
      columns: { passwordHash: false },
      limit: 500,
    });
    const artRows = await db
      .select({ userId: generations.userId, n: count() })
      .from(generations)
      .where(eq(generations.status, "completed"))
      .groupBy(generations.userId);
    const spentRows = await db
      .select({ userId: orders.userId, s: sum(orders.amount) })
      .from(orders)
      .where(eq(orders.status, "paid"))
      .groupBy(orders.userId);
    const arts = new Map(artRows.map((r) => [r.userId, r.n]));
    const spent = new Map(spentRows.map((r) => [r.userId, Number(r.s ?? 0) / 100]));
    const gens = await db.query.generations.findMany({
      orderBy: desc(generations.createdAt),
      limit: 200,
    });
    const enriched = list.map((u) => ({
      ...u,
      articles: arts.get(u.id) ?? 0,
      spent: spent.get(u.id) ?? 0,
    }));
    return NextResponse.json({ success: true, users: enriched, generations: gens });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

// PATCH /api/admin/users — adjust a user's credits (admin only).
// Body: { userId, delta }. Every change writes a ledger row,
// so the accounts always balance.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const userId = Number(body.userId);
    const delta = Math.trunc(Number(body.delta));
    if (!Number.isFinite(userId) || !Number.isFinite(delta) || delta === 0) {
      return NextResponse.json(
        { success: false, message: "userId and a non-zero delta are required." },
        { status: 400 }
      );
    }
    if (Math.abs(delta) > 10000) {
      return NextResponse.json({ success: false, message: "Delta too large (max 10000)." }, { status: 400 });
    }
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    const before = target.credits || 0;
    const newBalance = Math.max(0, before + delta);
    await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
    await db.insert(creditsLedger).values({
      userId,
      change: newBalance - before,
      reason: `Admin adjustment by user #${session.userId}`,
      balanceAfter: newBalance,
    });
    await logAudit({
      adminId: session.userId ?? null,
      adminEmail: session.email ?? "unknown",
      action: "credits.adjust",
      targetType: "user",
      targetId: userId,
      details: { delta: newBalance - before, before, after: newBalance },
    });
    return NextResponse.json({ success: true, credits: newBalance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}