import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/session";
import { createGenerationJob } from "@/lib/generation/engine";
import { checkRateLimit } from "@/lib/rate-limit";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/projects/[id]/bulk-generate
// Starts up to 10 jobs at once. Each job costs 1 credit.
// The browser then drives each job stage-by-stage (same as single generate).

const bodySchema = z.object({
  keywordIds: z.array(z.number().int().positive()).min(1).max(10),
  contentType: z.string().min(1).default("blog_post"),
  targetWords: z.number().int().min(400).max(3000).default(1200),
  tone: z.string().min(1).default("simple English"),
  mode: z.enum(["ai", "humanized"]).default("ai"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const gate = checkRateLimit(`bulk:${session.userId}`, 5, 60_000);
    if (!gate.allowed) {
      return NextResponse.json({ success: false, message: "Too many bulk jobs. Wait a minute." }, { status: 429 });
    }
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Invalid project id." }, { status: 400 });
    }
    const body = await request.json();
    const input = bodySchema.parse(body);
    const userId = session.userId!;

    const owner = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { credits: true },
    });
    const have = owner?.credits ?? 0;
    if (have < input.keywordIds.length) {
      return NextResponse.json(
        { success: false, message: `Not enough credits. Bulk needs ${input.keywordIds.length}, you have ${have}.` },
        { status: 400 }
      );
    }

    const started: { keywordId: number; generationId: number }[] = [];
    const failed: { keywordId: number; error: string }[] = [];
    for (const keywordId of input.keywordIds) {
      try {
        const job = await createGenerationJob({
          projectId,
          keywordId,
          userId,
          contentType: input.contentType,
          targetWords: input.targetWords,
          tone: input.tone,
          mode: input.mode,
        });
        started.push({ keywordId, generationId: job.generationId });
      } catch (err) {
        failed.push({ keywordId, error: err instanceof Error ? err.message : "Start failed." });
      }
    }
    return NextResponse.json({ success: true, started, failed }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message || "Invalid input." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not start bulk generation.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
