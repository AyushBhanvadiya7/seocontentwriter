import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, contents, keywords, projects, generations } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { desc, eq, inArray } from "drizzle-orm";

// GET /api/admin/content — every article enriched with keyword, project, user + trail.
export async function GET() {
  try {
    await requireAdmin();
    const arts = await db.query.contents.findMany({
      orderBy: desc(contents.createdAt),
      limit: 200,
    });
    const kwIds = Array.from(new Set(arts.map((a) => a.keywordId)));
    const projIds = Array.from(new Set(arts.map((a) => a.projectId)));
    const [kwRows, projRows] = await Promise.all([
      kwIds.length > 0
        ? db.query.keywords.findMany({
            where: inArray(keywords.id, kwIds),
            columns: { id: true, keyword: true },
          })
        : [],
      projIds.length > 0 ? db.query.projects.findMany({ where: inArray(projects.id, projIds) }) : [],
    ]);
    const kw = new Map(kwRows.map((k) => [k.id, k.keyword]));
    const proj = new Map(projRows.map((p) => [p.id, p]));
    const userIds = Array.from(new Set(projRows.map((p) => p.userId)));
    const userRows =
      userIds.length > 0
        ? await db.query.users.findMany({
            where: inArray(users.id, userIds),
            columns: { id: true, name: true, email: true },
          })
        : [];
    const who = new Map(userRows.map((u) => [u.id, u]));
    const artIds = arts.map((a) => a.id);
    const genRows =
      artIds.length > 0
        ? await db.query.generations.findMany({
            where: inArray(generations.contentId, artIds),
            orderBy: desc(generations.createdAt),
            limit: 500,
          })
        : [];
    const trail = new Map<number, (typeof genRows)[number]>();
    for (const g of genRows) {
      if (g.contentId && !trail.has(g.contentId)) trail.set(g.contentId, g);
    }

    return NextResponse.json({
      success: true,
      articles: arts.map((a) => {
        const p = proj.get(a.projectId);
        const u = p ? who.get(p.userId) : undefined;
        return {
          ...a,
          bodyHtml: undefined,
          bodyMarkdown: undefined,
          keyword: kw.get(a.keywordId) || "?",
          project: p ? { id: p.id, name: p.name } : null,
          user: u || null,
          generation: trail.get(a.id) || null,
        };
      }),
      projects: projRows.map((p) => ({ ...p, user: who.get(p.userId) || null })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// PATCH /api/admin/content — { action: "flag" | "remove", id, flagged? }.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const id = Number(body.id);
    const action = String(body.action || "");
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, message: "Invalid content id." }, { status: 400 });
    }
    const target = await db.query.contents.findFirst({ where: eq(contents.id, id) });
    if (!target) {
      return NextResponse.json({ success: false, message: "Article not found." }, { status: 404 });
    }
    const admin = { adminId: session.userId ?? null, adminEmail: session.email ?? "unknown" };

    if (action === "flag") {
      const flagged = Boolean(body.flagged);
      await db.update(contents).set({ flagged }).where(eq(contents.id, id));
      await logAudit({
        ...admin,
        action: flagged ? "content.flag" : "content.unflag",
        targetType: "content",
        targetId: id,
        details: { title: target.title },
      });
      return NextResponse.json({ success: true, flagged });
    }

    if (action === "remove") {
      await logAudit({
        ...admin,
        action: "content.remove",
        targetType: "content",
        targetId: id,
        details: { title: target.title, keywordId: target.keywordId },
      });
      await db.delete(contents).where(eq(contents.id, id));
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ success: false, message: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
