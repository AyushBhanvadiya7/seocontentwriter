import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, generations, orders, creditsLedger } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { desc, eq, inArray, like } from "drizzle-orm";

// GET /api/admin/issues — everything broken, one screen:
// paid-without-credits, failed orders, failed/refunded generations, live queue.
export async function GET() {
  try {
    await requireAdmin();

    const [failedOrders, paidOrders, pendingOrders, badGens, liveGens, purchaseRows] = await Promise.all([
      db.query.orders.findMany({
        where: eq(orders.status, "failed"),
        orderBy: desc(orders.createdAt),
        limit: 100,
      }),
      db.query.orders.findMany({
        where: eq(orders.status, "paid"),
        orderBy: desc(orders.createdAt),
        limit: 200,
      }),
      db.query.orders.findMany({
        where: eq(orders.status, "pending"),
        orderBy: desc(orders.createdAt),
        limit: 50,
      }),
      db.query.generations.findMany({
        where: inArray(generations.status, ["failed", "refunded"]),
        orderBy: desc(generations.createdAt),
        limit: 100,
      }),
      db.query.generations.findMany({
        where: inArray(generations.status, ["queued", "running"]),
        orderBy: desc(generations.createdAt),
        limit: 50,
      }),
      db
        .select({ reason: creditsLedger.reason })
        .from(creditsLedger)
        .where(like(creditsLedger.reason, "%pack purchased%"))
        .limit(2000),
    ]);

    // A paid order is "stuck" when no purchase ledger row mentions its order #.
    const credited = new Set<number>();
    for (const r of purchaseRows) {
      const m = r.reason.match(/order #(\d+)/);
      if (m) credited.add(Number(m[1]));
    }
    const stuckOrders = paidOrders.filter((o) => !credited.has(o.id));

    const userIds = Array.from(
      new Set(
        [...failedOrders, ...stuckOrders, ...pendingOrders]
          .map((o) => o.userId)
          .concat(badGens.map((g) => g.userId), liveGens.map((g) => g.userId))
      )
    );
    const userRows =
      userIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, userIds),
            columns: { id: true, name: true, email: true },
          })
        : [];
    const who = new Map(userRows.map((u) => [u.id, u]));
    const tag = (userId: number) => who.get(userId) || { id: userId, name: "?", email: "?" };

    return NextResponse.json({
      success: true,
      stuckOrders: stuckOrders.map((o) => ({ ...o, user: tag(o.userId) })),
      failedOrders: failedOrders.map((o) => ({ ...o, user: tag(o.userId) })),
      pendingOrders: pendingOrders.map((o) => ({ ...o, user: tag(o.userId) })),
      badGenerations: badGens.map((g) => ({ ...g, user: tag(g.userId) })),
      liveNow: liveGens.map((g) => ({ ...g, user: tag(g.userId) })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
