import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, generations, creditsLedger, orders, projects, keywords, contents } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { count, desc, eq } from "drizzle-orm";

// GET /api/admin/users/[id] — full profile bundle for one user.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
    }
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    const [ledger, userOrders, userProjects, gens, kwCounts, contentCounts] = await Promise.all([
      db.query.creditsLedger.findMany({
        where: eq(creditsLedger.userId, userId),
        orderBy: desc(creditsLedger.createdAt),
        limit: 100,
      }),
      db.query.orders.findMany({
        where: eq(orders.userId, userId),
        orderBy: desc(orders.createdAt),
        limit: 100,
      }),
      db.query.projects.findMany({
        where: eq(projects.userId, userId),
        orderBy: desc(projects.createdAt),
        limit: 100,
      }),
      db.query.generations.findMany({
        where: eq(generations.userId, userId),
        orderBy: desc(generations.createdAt),
        limit: 100,
      }),
      db.select({ projectId: keywords.projectId, n: count() }).from(keywords).groupBy(keywords.projectId),
      db.select({ projectId: contents.projectId, n: count() }).from(contents).groupBy(contents.projectId),
    ]);

    const kw = new Map(kwCounts.map((r) => [r.projectId, r.n]));
    const ct = new Map(contentCounts.map((r) => [r.projectId, r.n]));
    const enrichedProjects = userProjects.map((p) => ({
      ...p,
      keywordCount: kw.get(p.id) ?? 0,
      articleCount: ct.get(p.id) ?? 0,
    }));
    const lifetimeValue =
      userOrders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0) / 100;

    const timeline: { at: string; text: string }[] = [{ at: user.createdAt.toISOString(), text: "Signed up" }];
    if (user.emailVerifiedAt) {
      timeline.push({ at: user.emailVerifiedAt.toISOString(), text: "Verified email" });
    }
    for (const o of userOrders) {
      timeline.push({
        at: o.createdAt.toISOString(),
        text:
          o.status === "paid"
            ? `Bought ${o.plan} plan (Rs.${(o.amount / 100).toLocaleString("en-IN")})`
            : `Order ${o.status} (${o.plan})`,
      });
    }
    for (const g of gens) {
      timeline.push({
        at: g.createdAt.toISOString(),
        text:
          g.status === "completed"
            ? `Article #${g.id} completed (${g.modelName || "AI"})`
            : `Generation #${g.id} ${g.status}`,
      });
    }
    timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({
      success: true,
      user,
      ledger,
      orders: userOrders,
      projects: enrichedProjects,
      generations: gens,
      lifetimeValue,
      timeline: timeline.slice(0, 50),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// PATCH /api/admin/users/[id] — actions: adjust | role | status | delete.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
    }
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const isSelf = session.userId === userId;
    const admin = { adminId: session.userId ?? null, adminEmail: session.email ?? "unknown" };

    if (action === "adjust") {
      const delta = Math.trunc(Number(body.delta));
      const reason =
        String(body.reason || "").trim().slice(0, 200) || `Admin adjustment by user #${session.userId}`;
      if (!Number.isFinite(delta) || delta === 0) {
        return NextResponse.json({ success: false, message: "A non-zero delta is required." }, { status: 400 });
      }
      if (Math.abs(delta) > 10000) {
        return NextResponse.json({ success: false, message: "Delta too large (max 10000)." }, { status: 400 });
      }
      const before = target.credits || 0;
      const newBalance = Math.max(0, before + delta);
      await db.update(users).set({ credits: newBalance }).where(eq(users.id, userId));
      await db.insert(creditsLedger).values({
        userId,
        change: newBalance - before,
        reason,
        balanceAfter: newBalance,
      });
      await logAudit({
        ...admin,
        action: "credits.adjust",
        targetType: "user",
        targetId: userId,
        details: { delta: newBalance - before, before, after: newBalance, reason },
      });
      return NextResponse.json({ success: true, credits: newBalance });
    }

    if (action === "role") {
      const role = String(body.role || "");
      if (role !== "user" && role !== "admin") {
        return NextResponse.json({ success: false, message: "Role must be user or admin." }, { status: 400 });
      }
      if (isSelf && role !== "admin") {
        return NextResponse.json(
          { success: false, message: "You cannot remove your own admin access." },
          { status: 400 }
        );
      }
      await db.update(users).set({ role: role as "user" | "admin" }).where(eq(users.id, userId));
      await logAudit({
        ...admin,
        action: "user.role",
        targetType: "user",
        targetId: userId,
        details: { from: target.role, to: role },
      });
      return NextResponse.json({ success: true, role });
    }

    if (action === "status") {
      const status = String(body.status || "");
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json(
          { success: false, message: "Status must be active or suspended." },
          { status: 400 }
        );
      }
      if (isSelf) {
        return NextResponse.json(
          { success: false, message: "You cannot suspend your own account." },
          { status: 400 }
        );
      }
      await db.update(users).set({ status }).where(eq(users.id, userId));
      await logAudit({
        ...admin,
        action: "user.status",
        targetType: "user",
        targetId: userId,
        details: { from: target.status, to: status },
      });
      return NextResponse.json({ success: true, status });
    }

    if (action === "delete") {
      if (isSelf) {
        return NextResponse.json(
          { success: false, message: "You cannot delete your own account." },
          { status: 400 }
        );
      }
      await logAudit({
        ...admin,
        action: "user.delete",
        targetType: "user",
        targetId: userId,
        details: { email: target.email },
      });
      await db.delete(users).where(eq(users.id, userId));
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ success: false, message: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
