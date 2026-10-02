import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { keywords, projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function ownsKeyword(session: { userId?: number }, keywordId: number) {
  const kw = await db.query.keywords.findFirst({
    where: eq(keywords.id, keywordId),
    with: { project: true },
  });
  return kw && kw.project?.userId === session.userId;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const keywordId = parseInt(id, 10);
    if (!(await ownsKeyword(session, keywordId))) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    const body = await request.json();
    const [updated] = await db
      .update(keywords)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(keywords.id, keywordId))
      .returning();
    return NextResponse.json({ success: true, keyword: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const keywordId = parseInt(id, 10);
    if (!(await ownsKeyword(session, keywordId))) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    await db.update(keywords).set({ deletedAt: new Date() }).where(eq(keywords.id, keywordId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
