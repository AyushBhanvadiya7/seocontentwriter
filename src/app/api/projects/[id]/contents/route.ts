import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/db";
import { projects, contents, keywords } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/contents — this project's articles, newest first.
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Invalid project id." }, { status: 400 });
    }
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, session.userId!)),
    });
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found." }, { status: 404 });
    }
    const list = await db.query.contents.findMany({
      where: eq(contents.projectId, projectId),
      orderBy: desc(contents.createdAt),
      limit: 200,
    });
    const kid = Array.from(new Set(list.map((c) => c.keywordId)));
    const krows =
      kid.length > 0
        ? await db.query.keywords.findMany({
            where: inArray(keywords.id, kid),
            columns: { id: true, keyword: true },
          })
        : [];
    const kwById = new Map(krows.map((k) => [k.id, k.keyword]));
    return NextResponse.json({
      success: true,
      contents: list.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        wordCount: c.wordCount,
        keyword: kwById.get(c.keywordId) || null,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
