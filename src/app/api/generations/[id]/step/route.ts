import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { runNextStage, getGenerationState } from "@/lib/generation/engine";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";


// POST /api/generations/[id]/step
// Runs exactly ONE stage per call. The browser calls it again and again
// until `done: true` comes back.
// One stage always fits inside the 60s serverless limit.

export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    // AI stages cost money: 20 calls per minute per user (normal use needs ~5).
    const gate = checkRateLimit(`step:${session.userId}`, 20, 60_000);
    if (!gate.allowed) {
      return NextResponse.json({ success: false, message: "Too many generation calls. Wait a minute." }, { status: 429 });
    }
    const { id } = await context.params;
    const generationId = parseInt(id, 10);

    if (!Number.isFinite(generationId)) {
      return NextResponse.json({ success: false, message: "Invalid generation id." }, { status: 400 });
    }

    const result = await runNextStage(generationId, session.userId!);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stage failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// Progress check — shows progress even after a page refresh.
export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const generationId = parseInt(id, 10);

    const state = await getGenerationState(generationId, session.userId!);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Not found.";
    return NextResponse.json({ success: false, message }, { status: 404 });
  }
}
