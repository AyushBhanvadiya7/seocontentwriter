import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { keywords } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, ilike, desc, or } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const cluster = searchParams.get("cluster") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 50;

    let where = eq(keywords.projectId, projectId);
    if (q) {
      where = and(where, ilike(keywords.keyword, `%${q}%`)) as any;
    }
    if (status) {
      where = and(where, eq(keywords.status, status as any)) as any;
    }
    if (cluster) {
      where = and(where, eq(keywords.clusterId, parseInt(cluster, 10))) as any;
    }

    const list = await db.query.keywords.findMany({
      where,
      with: { cluster: true },
      orderBy: desc(keywords.createdAt),
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({ success: true, keywords: list, page, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    const body = await request.json();
    const items = Array.isArray(body.keywords) ? body.keywords : [body.keyword];

    const values = items
      .filter(Boolean)
      .map((k: string) => ({
        projectId,
        keyword: k.trim(),
        normalizedKeyword: k.toLowerCase().replace(/[^a-z0-9\u0900-\u097F\u0A80-\u0AFF\s]/g, "").replace(/\s+/g, " ").trim(),
      }));

    if (values.length === 0) {
      return NextResponse.json({ success: false, message: "No keywords provided" }, { status: 400 });
    }

    await db.insert(keywords).values(values as any);
    return NextResponse.json({ success: true, saved: values.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add keywords";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
