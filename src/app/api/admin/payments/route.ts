import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { and, count, desc, eq, gte, inArray, sum } from "drizzle-orm";

function startOfDay(daysAgo = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

const num = (v: string | number | null | undefined): number => Number(v ?? 0) || 0;

// GET /api/admin/payments — orders + plan-wise sales + revenue summary.
export async function GET() {
  try {
    await requireAdmin();

    const list = await db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 200,
    });
    const userIds = Array.from(new Set(list.map((o) => o.userId)));
    const userRows =
      userIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, userIds),
            columns: { id: true, name: true, email: true },
          })
        : [];
    const who = new Map(userRows.map((u) => [u.id, u]));

    const paid = eq(orders.status, "paid");
    const paidRows = await db
      .select({ plan: orders.plan, n: count(), s: sum(orders.amount) })
      .from(orders)
      .where(paid)
      .groupBy(orders.plan);

    const today = startOfDay(0);
    const weekAgo = startOfDay(7);
    const monthAgo = startOfDay(30);
    const [rAll] = await db.select({ s: sum(orders.amount) }).from(orders).where(paid);
    const [rToday] = await db
      .select({ s: sum(orders.amount) })
      .from(orders)
      .where(and(paid, gte(orders.createdAt, today)));
    const [rWeek] = await db
      .select({ s: sum(orders.amount) })
      .from(orders)
      .where(and(paid, gte(orders.createdAt, weekAgo)));
    const [rMonth] = await db
      .select({ s: sum(orders.amount) })
      .from(orders)
      .where(and(paid, gte(orders.createdAt, monthAgo)));

    return NextResponse.json({
      success: true,
      orders: list.map((o) => ({ ...o, user: who.get(o.userId) || null })),
      planSales: paidRows.map((r) => ({ plan: r.plan, count: r.n, revenue: num(r.s) / 100 })),
      revenue: {
        today: num(rToday?.s) / 100,
        week: num(rWeek?.s) / 100,
        month: num(rMonth?.s) / 100,
        all: num(rAll?.s) / 100,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
