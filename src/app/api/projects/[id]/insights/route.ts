import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/db";
import { projects, contents, keywords, generations } from "@/db/schema";
import { and, count, eq, sum } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const num = (v: string | number | null | undefined): number => Number(v ?? 0) || 0;

// GET /api/projects/[id]/insights — keyword/article/AI numbers for one project.
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

    const kwRows = await db
      .select({ status: keywords.status, n: count() })
      .from(keywords)
      .where(eq(keywords.projectId, projectId))
      .groupBy(keywords.status);

    const artRows = await db
      .select({ status: contents.status, n: count() })
      .from(contents)
      .where(eq(contents.projectId, projectId))
      .groupBy(contents.status);
    const [artWords] = await db
      .select({ w: sum(contents.wordCount) })
      .from(contents)
      .where(eq(contents.projectId, projectId));

    const genRows = await db
      .select({ status: generations.status, n: count() })
      .from(generations)
      .where(eq(generations.projectId, projectId))
      .groupBy(generations.status);
    const [genCost] = await db
      .select({ credits: sum(generations.creditsUsed), usd: sum(generations.apiCostUsd) })
      .from(generations)
      .where(eq(generations.projectId, projectId));

    const byStatus = (rows: { status: string; n: number }[]) => {
      const out: Record<string, number> = {};
      for (const r of rows) out[r.status] = r.n;
      return out;
    };

    return NextResponse.json({
      success: true,
      insights: {
        keywords: {
          total: kwRows.reduce((s, r) => s + r.n, 0),
          byStatus: byStatus(kwRows),
        },
        articles: {
          total: artRows.reduce((s, r) => s + r.n, 0),
          words: num(artWords?.w),
          byStatus: byStatus(artRows),
        },
        ai: {
          runs: genRows.reduce((s, r) => s + r.n, 0),
          byStatus: byStatus(genRows),
          creditsUsed: num(genCost?.credits),
          costUsd: num(genCost?.usd),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
