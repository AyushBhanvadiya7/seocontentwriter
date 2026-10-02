import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sources, projects, keywords, clusters } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, inArray } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string; sid: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id, sid } = await context.params;
    const projectId = parseInt(id, 10);
    const sourceId = parseInt(sid, 10);

    if (!Number.isFinite(projectId) || !Number.isFinite(sourceId)) {
      return NextResponse.json({ success: false, message: "Invalid project or source id." }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, session.userId!)),
      columns: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found." }, { status: 404 });
    }

    const source = await db.query.sources.findFirst({
      where: and(
        eq(sources.id, sourceId),
        eq(sources.projectId, projectId),
        eq(sources.uploadedBy, session.userId!)
      ),
    });
    if (!source) {
      return NextResponse.json({ success: false, message: "Source not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.rows) || body.rows.length > 50) {
      return NextResponse.json({ success: false, message: "Invalid keyword preview." }, { status: 400 });
    }

    const rows = body.rows as Array<{ keyword: string; cluster?: string }>;
    if (rows.some((row) => !row || typeof row.keyword !== "string" || row.keyword.length < 2 || row.keyword.length > 120)) {
      return NextResponse.json({ success: false, message: "One or more keywords are invalid." }, { status: 400 });
    }

    const excludedValues = Array.isArray(body.excluded) ? body.excluded : [];
    const excluded = new Set<number>(
      excludedValues.filter(
        (index: unknown): index is number =>
          typeof index === "number" && Number.isInteger(index) && index >= 0 && index < rows.length
      )
    );

    // Build clusters
    const clusterMap = new Map<string, number>();
    const clusterNames = Array.from(new Set(rows.map((r: { cluster?: string }) => r.cluster).filter(Boolean)));
    for (const name of clusterNames) {
      const [cluster] = await db
        .insert(clusters)
        .values({ projectId, name: name as string, keywordCount: 0 })
        .onConflictDoNothing()
        .returning();
      if (cluster) clusterMap.set(name as string, cluster.id);
    }

    // Fetch existing clusters for names that already exist
    const existingClusters = await db.query.clusters.findMany({
      where: and(eq(clusters.projectId, projectId), inArray(clusters.name, clusterNames as string[])),
    });
    for (const c of existingClusters) clusterMap.set(c.name, c.id);

    const keywordValues = rows
      .filter((_: unknown, idx: number) => !excluded.has(idx))
      .map((row: { keyword: string; volume?: number; difficulty?: number; intent?: string; cluster?: string; city?: string; language?: string; notes?: string; slug_guess?: string; content_type?: string; priority?: number; status?: string }) => ({
        projectId,
        sourceId,
        keyword: row.keyword,
        normalizedKeyword: row.keyword.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0A80-\u0AFF\s]/g, "").replace(/\s+/g, " ").trim(),
        volume: row.volume,
        difficulty: row.difficulty,
        intent: row.intent,
        clusterId: row.cluster ? clusterMap.get(row.cluster) : null,
        city: row.city,
        language: row.language,
        notes: row.notes,
        slugGuess: row.slug_guess,
        priority: row.priority,
      }));

    if (keywordValues.length > 0) {
      await db.insert(keywords).values(keywordValues as any);
    }

    // Update cluster counts
    for (const [name, clusterId] of clusterMap.entries()) {
      const count = await db.query.keywords.findMany({
        where: and(eq(keywords.projectId, projectId), eq(keywords.clusterId, clusterId)),
      });
      await db.update(clusters).set({ keywordCount: count.length }).where(eq(clusters.id, clusterId));
    }

    return NextResponse.json({ success: true, saved: keywordValues.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Commit failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
