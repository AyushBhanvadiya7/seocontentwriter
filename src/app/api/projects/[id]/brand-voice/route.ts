import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brandVoices, projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

type Patch = Partial<typeof brandVoices.$inferInsert>;

// One brand-voice row per project. GET reads it, PUT creates/updates it.
// The engine reads this row while writing articles.
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Invalid project id." }, { status: 400 });
    }
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }
    const row = await db.query.brandVoices.findFirst({
      where: eq(brandVoices.projectId, projectId),
    });
    return NextResponse.json({ success: true, brandVoice: row || null });
  } catch (error) {
    return authSafe(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Invalid project id." }, { status: 400 });
    }
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: Patch = {};
    if (body.tone !== undefined) patch.tone = toText(body.tone, 100) || "simple English";
    if (body.readingLevel !== undefined) patch.readingLevel = toText(body.readingLevel, 50) || "Grade 7";
    if (body.authorName !== undefined) patch.authorName = toText(body.authorName, 255);
    if (body.authorBio !== undefined) patch.authorBio = toText(body.authorBio, 2000);
    if (body.authorCredentials !== undefined) patch.authorCredentials = toText(body.authorCredentials, 2000);
    if (body.sampleWriting !== undefined) patch.sampleWriting = toText(body.sampleWriting, 5000);
    if (body.standardCta !== undefined) patch.standardCta = toText(body.standardCta, 2000);
    if (body.mustUseWords !== undefined) patch.mustUseWords = toList(body.mustUseWords);
    if (body.bannedWords !== undefined) patch.bannedWords = toList(body.bannedWords);
    if (body.forbiddenTopics !== undefined) patch.forbiddenTopics = toList(body.forbiddenTopics);
    if (body.uniqueExperienceFacts !== undefined) patch.uniqueExperienceFacts = toList(body.uniqueExperienceFacts);
    if (body.disclaimers !== undefined) patch.disclaimers = toList(body.disclaimers);

    const existing = await db.query.brandVoices.findFirst({
      where: eq(brandVoices.projectId, projectId),
    });
    if (existing) {
      await db.update(brandVoices).set(patch).where(eq(brandVoices.projectId, projectId));
    } else {
      await db.insert(brandVoices).values({ projectId, ...patch });
    }
    const row = await db.query.brandVoices.findFirst({
      where: eq(brandVoices.projectId, projectId),
    });
    return NextResponse.json({ success: true, brandVoice: row });
  } catch (error) {
    return authSafe(error);
  }
}

function authSafe(error: unknown) {
  const message = error instanceof Error ? error.message : "Failed.";
  if (message === "AUTH_REQUIRED") {
    return NextResponse.json({ success: false, message: "Login required." }, { status: 401 });
  }
  return NextResponse.json({ success: false, message }, { status: 500 });
}

// Accepts an array or a comma/newline separated string.
function toList(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 100);
  }
  if (typeof v === "string") {
    return v
      .split(/[\n,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 100);
  }
  return [];
}

function toText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}
