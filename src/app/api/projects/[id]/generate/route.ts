import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/session";
import { createGenerationJob } from "@/lib/generation/engine";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";


// POST /api/projects/[id]/generate
// Starts the job ONLY — no AI call happens here,
// so this request finishes in under a second.
//
// Returns: { generationId, ... }
// The browser then calls /api/generations/{id}/step again and again,
// running one stage per request. Small requests never time out.

const bodySchema = z.object({
  keywordId: z.number().int().positive(),
  customTitle: z.string().max(200).optional().nullable(),
  contentType: z.string().min(1).default("blog_post"),
  targetWords: z.number().int().min(400).max(3000).default(1200),
  tone: z.string().min(1).default("simple English"),
  extraInstructions: z.string().max(2000).optional(),
  secondaryKeywords: z.array(z.string()).max(20).default([]),
  mode: z.enum(["ai", "humanized"]).default("ai"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    // Job-spam guard: 5 new jobs per minute per user.
    const gate = checkRateLimit(`generate:${session.userId}`, 5, 60_000);
    if (!gate.allowed) {
      return NextResponse.json({ success: false, message: "Too many new jobs. Wait a minute." }, { status: 429 });
    }
    const { id } = await context.params;
    const projectId = parseInt(id, 10);

    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Invalid project id." }, { status: 400 });
    }

    const body = await request.json();
    const input = bodySchema.parse(body);

    const job = await createGenerationJob({
      projectId,
      keywordId: input.keywordId,
      userId: session.userId!,
      customTitle: input.customTitle?.trim() || undefined,
      contentType: input.contentType,
      targetWords: input.targetWords,
      tone: input.tone,
      extraInstructions: input.extraInstructions,
      secondaryKeywords: input.secondaryKeywords,
      mode: input.mode,
    });

    return NextResponse.json({ success: true, ...job }, { status: 202 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || "Invalid input." },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Could not start generation.";
    const status = /not found|exhausted|too short|already exists|not yours|no AI key|invalid/i.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
