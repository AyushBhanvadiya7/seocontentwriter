import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, creditsLedger } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { PLANS, type PlanId } from "@/lib/billing";
import { eq, desc } from "drizzle-orm";

// GET /api/billing/history
// The logged-in user's purchases + full credit ledger (newest first).
export async function GET() {
  try {
    const session = await requireAuth();

    const [orderRows, ledgerRows] = await Promise.all([
      db.query.orders.findMany({
        where: eq(orders.userId, session.userId!),
        orderBy: desc(orders.createdAt),
        limit: 50,
      }),
      db.query.creditsLedger.findMany({
        where: eq(creditsLedger.userId, session.userId!),
        orderBy: desc(creditsLedger.createdAt),
        limit: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      orders: orderRows.map((o) => ({
        id: o.id,
        plan: o.plan,
        planName: PLANS[o.plan as PlanId]?.name || o.plan,
        credits: PLANS[o.plan as PlanId]?.credits || 0,
        amount: o.amount,
        currency: o.currency || "INR",
        status: o.status,
        date: o.createdAt,
      })),
      ledger: ledgerRows.map((l) => ({
        id: l.id,
        change: l.change,
        reason: l.reason,
        balanceAfter: l.balanceAfter,
        date: l.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load history.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
