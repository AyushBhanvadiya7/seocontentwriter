import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getProject(session: { userId?: number }, id: number) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, session.userId!)),
    with: { brandVoice: true },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    const project = await getProject(session, projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    const project = await getProject(session, projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }
    const body = await request.json();
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };

    if (body.siteType) {
      const currentSettings = (project.settings as Record<string, unknown>) || {};
      updateData.settings = { ...currentSettings, siteType: body.siteType };
      delete updateData.siteType;

      if (body.siteType === "global") {
        updateData.targetCity = null;
      }
    }

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    const project = await getProject(session, projectId);
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }
    // Hard delete: all project data (keywords, articles, briefs...) cascades in the DB.
    await db.delete(projects).where(eq(projects.id, projectId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
