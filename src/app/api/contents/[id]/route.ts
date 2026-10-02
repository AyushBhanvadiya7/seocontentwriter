import { NextResponse } from "next/server";
import { db } from "@/db";
import { contents, keywords } from "@/db/schema";import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const contentId = parseInt(id, 10);

    const content = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: { project: true, keyword: true, brief: true },
    });

    if (!content || content.project?.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

// PATCH /api/contents/[id]
// Updates the article text. Only the owner can edit.
// Accepts: title, h1, metaTitle, metaDescription, bodyMarkdown.
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const contentId = parseInt(id, 10);

    if (!Number.isFinite(contentId)) {
      return NextResponse.json({ success: false, message: "Invalid content id." }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const patch: {
      title?: string;
      h1?: string;
      metaTitle?: string;
      metaDescription?: string;
      bodyMarkdown?: string;
      bodyHtml?: string;
      wordCount?: number;
      status?: "draft" | "approved" | "published";
      updatedAt?: Date;
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (!title) {
        return NextResponse.json({ success: false, message: "Title cannot be empty." }, { status: 400 });
      }
      patch.title = title.slice(0, 500);
    }
    if (body.h1 !== undefined) patch.h1 = String(body.h1).trim().slice(0, 500) || patch.title || "";
    if (body.metaTitle !== undefined) patch.metaTitle = String(body.metaTitle).trim().slice(0, 500);
    if (body.metaDescription !== undefined) patch.metaDescription = String(body.metaDescription).trim().slice(0, 1000);

    if (body.bodyMarkdown !== undefined) {
      const markdown = String(body.bodyMarkdown);
      if (!markdown.trim()) {
        return NextResponse.json({ success: false, message: "Article text cannot be empty." }, { status: 400 });
      }
      // Same markdown -> clean HTML conversion the engine uses.
      const rawHtml = await marked(markdown.slice(0, 200000));
      patch.bodyMarkdown = markdown.slice(0, 200000);
      patch.bodyHtml = sanitizeHtml(rawHtml, {
        allowedTags: [
          "h1", "h2", "h3", "h4", "p", "ul", "ol", "li",
          "table", "thead", "tbody", "tr", "th", "td",
          "a", "strong", "em", "blockquote", "code", "br", "hr",
        ],
        allowedAttributes: { a: ["href", "title", "rel"], th: ["scope"] },
      });
      patch.wordCount = markdown.split(/\s+/).filter(Boolean).length;
    }
  if (body.status !== undefined) {
      const status = String(body.status);
      if (status !== "draft" && status !== "approved" && status !== "published") {
        return NextResponse.json({ success: false, message: "Invalid status." }, { status: 400 });
      }
      patch.status = status;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: false, message: "Nothing to update." }, { status: 400 });
    }

    const existing = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: { project: true },
    });

    if (!existing || existing.project?.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    patch.updatedAt = new Date();
    await db.update(contents).set(patch).where(eq(contents.id, contentId));

    const updated = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: { project: true, keyword: true, brief: true },
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
// Deletes the article. Only the owner. Export/version rows go away
// automatically (database cascade); keyword pointers are cleared.
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const contentId = parseInt(id, 10);

    if (!Number.isFinite(contentId)) {
      return NextResponse.json({ success: false, message: "Invalid content id." }, { status: 400 });
    }

    const existing = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: { project: true },
    });

    if (!existing || existing.project?.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    await db.update(keywords).set({ usedInContentId: null }).where(eq(keywords.usedInContentId, contentId));
    await db.delete(contents).where(eq(contents.id, contentId));

    return NextResponse.json({ success: true, deleted: contentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}