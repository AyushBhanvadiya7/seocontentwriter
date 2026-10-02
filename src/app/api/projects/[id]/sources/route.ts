import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sources, projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { saveUploadedFile, validateFileType } from "@/lib/upload";
import { parseKeywordFile } from "@/lib/parser";
import { eq, and, desc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: upload history for this project (newest first).
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

    const list = await db.query.sources.findMany({
      where: eq(sources.projectId, projectId),
      orderBy: desc(sources.createdAt),
      columns: { filePath: false },
      limit: 100,
    });

    return NextResponse.json({ success: true, sources: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load sources.";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const projectId = parseInt(id, 10);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: "File must be under 10 MB" }, { status: 400 });
    }

    const typeCheck = validateFileType(file.name, file.type || "application/octet-stream");
    if (!typeCheck.valid) {
      return NextResponse.json({ success: false, message: typeCheck.reason }, { status: 400 });
    }

    const saved = await saveUploadedFile(file, `project-${projectId}`);
    const { rows, report } = await parseKeywordFile(saved.filePath, saved.fileType, saved.originalName);

    const [source] = await db
      .insert(sources)
      .values({
        projectId,
        fileName: saved.originalName,
        filePath: saved.filePath,
        fileType: saved.fileType,
        rowCount: report.rowsFound,
        parseReport: report,
        uploadedBy: session.userId!,
      })
      .returning();

    return NextResponse.json({ success: true, source, preview: rows.slice(0, 50), report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
