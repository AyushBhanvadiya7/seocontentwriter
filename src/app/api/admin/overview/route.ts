import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, generations, orders, creditsLedger } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { and, count, desc, eq, gte, inArray, like, sum } from "drizzle-orm";

// Approx USD -> INR for AI cost display. Not a live forex rate.
const USD_TO_INR = 83;

function startOfDay(daysAgo = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const num = (v: string | number | null | undefined): number => Number(v ?? 0) || 0;

// GET /api/admin/overview — one call with every number the admin dashboard shows.
export async function GET() {
  try {
    await requireAdmin();

    const today = startOfDay(0);
    const weekAgo = startOfDay(7);
    const monthAgo = startOfDay(30);
    const done = eq(generations.status, "completed");
    const paid = eq(orders.status, "paid");

    const [uTotal] = await db.select({ n: count() }).from(users);
    const [uToday] = await db.select({ n: count() }).from(users).where(gte(users.createdAt, today));
    const [uWeek] = await db.select({ n: count() }).from(users).where(gte(users.createdAt, weekAgo));

    const [aAll] = await db.select({ n: count() }).from(generations).where(done);
    const [aToday] = await db
      .select({ n: count() })
      .from(generations)
      .where(and(done, gte(generations.createdAt, today)));
    const [aWeek] = await db
      .select({ n: count() })
      .from(generations)
      .where(and(done, gte(generations.createdAt, weekAgo)));
    const [aMonth] = await db
      .select({ n: count() })
      .from(generations)
      .where(and(done, gte(generations.createdAt, monthAgo)));

    const [live] = await db
      .select({ n: count() })
      .from(generations)
      .where(inArray(generations.status, ["queued", "running"]));
    const [failed] = await db
      .select({ n: count() })
      .from(generations)
      .where(inArray(generations.status, ["failed", "refunded"]));
    const [gTotal] = await db.select({ n: count() }).from(generations);

    // orders.amount is stored in paise (₹499 = 49900). Display rupees.
    const [rAll] = await db.select({ s: sum(orders.amount) }).from(orders).where(paid);
    const [rToday] = await db
      .select({ s: sum(orders.amount) })
      .from(orders)
      .where(and(paid, gte(orders.createdAt, today)));
    const [rMonth] = await db
      .select({ s: sum(orders.amount) })
      .from(orders)
      .where(and(paid, gte(orders.createdAt, monthAgo)));

    const [free] = await db
      .select({ s: sum(creditsLedger.change) })
      .from(creditsLedger)
      .where(eq(creditsLedger.reason, "Welcome trial credits"));
    const [sold] = await db
      .select({ s: sum(creditsLedger.change) })
      .from(creditsLedger)
      .where(like(creditsLedger.reason, "%pack purchased%"));

    const [cToday] = await db
      .select({ s: sum(generations.apiCostUsd) })
      .from(generations)
      .where(gte(generations.createdAt, today));
    const [cMonth] = await db
      .select({ s: sum(generations.apiCostUsd) })
      .from(generations)
      .where(gte(generations.createdAt, monthAgo));

    const signups = await db
      .select({ at: users.createdAt })
      .from(users)
      .where(gte(users.createdAt, monthAgo))
      .orderBy(desc(users.createdAt))
      .limit(5000);
    const arts = await db
      .select({ at: generations.createdAt })
      .from(generations)
      .where(and(done, gte(generations.createdAt, monthAgo)))
      .orderBy(desc(generations.createdAt))
      .limit(5000);

    const buckets = new Map<string, { date: string; signups: number; articles: number }>();
    for (let i = 29; i >= 0; i--) {
      const k = dayKey(startOfDay(i));
      buckets.set(k, { date: k, signups: 0, articles: 0 });
    }
    for (const r of signups) {
      const b = buckets.get(dayKey(r.at));
      if (b) b.signups++;
    }
    for (const r of arts) {
      const b = buckets.get(dayKey(r.at));
      if (b) b.articles++;
    }

    const gCount = gTotal?.n ?? 0;
    const fCount = failed?.n ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        users: { total: uTotal?.n ?? 0, today: uToday?.n ?? 0, week: uWeek?.n ?? 0 },
        articles: { all: aAll?.n ?? 0, today: aToday?.n ?? 0, week: aWeek?.n ?? 0, month: aMonth?.n ?? 0 },
        generatingNow: live?.n ?? 0,
        revenue: { today: num(rToday?.s) / 100, month: num(rMonth?.s) / 100, all: num(rAll?.s) / 100 },
        credits: { freeGiven: num(free?.s), paidSold: num(sold?.s) },
        failed: { count: fCount, pct: gCount === 0 ? 0 : Math.round((fCount / gCount) * 100) },
        aiCost: { today: num(cToday?.s) * USD_TO_INR, month: num(cMonth?.s) * USD_TO_INR },
        series: Array.from(buckets.values()),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
