import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promptTemplates } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
    const list = await db.query.promptTemplates.findMany({
      orderBy: desc(promptTemplates.createdAt),
      limit: 200,
    });
    return NextResponse.json({ success: true, prompts: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ success: false, message }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { id, body: promptBody, isActive } = body;

    const existing = await db.query.promptTemplates.findFirst({ where: eq(promptTemplates.id, id) });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Prompt not found" }, { status: 404 });
    }

    // Create new version
    const [updated] = await db
      .insert(promptTemplates)
      .values({
        key: existing.key,
        stage: existing.stage,
        body: promptBody,
        version: existing.version + 1,
        isActive: isActive ?? true,
        createdBy: session.userId,
      })
      .returning();

    // Deactivate old version
    await db.update(promptTemplates).set({ isActive: false }).where(eq(promptTemplates.id, existing.id));

    return NextResponse.json({ success: true, prompt: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
