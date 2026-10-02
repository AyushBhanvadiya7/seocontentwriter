import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, contents, keywords, projects, generations, contentVersions } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { desc, eq } from "drizzle-orm";

// GET /api/admin/content/[id] — one full article + keyword + trail + versions.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const contentId = Number(id);
    if (!Number.isFinite(contentId)) {
      return NextResponse.json({ success: false, message: "Invalid content id." }, { status: 400 });
    }
    const article = await db.query.contents.findFirst({ where: eq(contents.id, contentId) });
    if (!article) {
      return NextResponse.json({ success: false, message: "Article not found." }, { status: 404 });
    }
    const [kw, proj, gens, versions] = await Promise.all([
      db.query.keywords.findFirst({
        where: eq(keywords.id, article.keywordId),
        columns: { id: true, keyword: true },
      }),
      db.query.projects.findFirst({ where: eq(projects.id, article.projectId) }),
      db.query.generations.findMany({
        where: eq(generations.contentId, contentId),
        orderBy: desc(generations.createdAt),
        limit: 5,
      }),
      db.query.contentVersions.findMany({
        where: eq(contentVersions.contentId, contentId),
        orderBy: desc(contentVersions.createdAt),
        limit: 20,
      }),
    ]);
    let user = null;
    if (proj) {
      user = await db.query.users.findFirst({
        where: eq(users.id, proj.userId),
        columns: { id: true, name: true, email: true },
      });
    }
    return NextResponse.json({
      success: true,
      article,
      keyword: kw || null,
      project: proj || null,
      user: user || null,
      generations: gens,
      versions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
