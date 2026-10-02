import { NextResponse } from "next/server";
import { db } from "@/db";
import { contents, keywords, projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { validateContent } from "@/lib/generation/stages";

// Human mode: the person writes, the AI writes nothing.
// POST { action: "score" } -> SEO scores only, nothing saved.
// POST { action: "save" } -> scores + saved as a draft article.
// Human articles are free (no credit cut): there is no AI cost.
// A human article is recognised by briefId = null (AI always sets one).

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: 'POST { action: "score" | "save", projectId, keyword, title, body, metaTitle?, metaDescription?, targetWords? }',
  });
}

interface HumanBody {
  action?: string;
  projectId?: number;
  keyword?: string;
  title?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  targetWords?: number;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const input = (await request.json().catch(() => ({}))) as HumanBody;

    const keyword = (input.keyword || "").trim();
    const body = (input.body || "").trim();
    if (!keyword) {
      return NextResponse.json({ success: false, message: "Keyword is required." }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ success: false, message: "Write something first." }, { status: 400 });
    }

    const h1 = (input.title || "").trim() || keyword;
    const fullText = `# ${h1}\n\n${body}`;
    const targetWords = Number.isFinite(input.targetWords) ? Number(input.targetWords) : 1200;
    const meta = { meta_title: input.metaTitle || "", meta_description: input.metaDescription || "" };
    const validation = validateContent(fullText, meta, keyword, targetWords);

    if (input.action === "score") {
      return NextResponse.json({ success: true, validation });
    }
    if (input.action !== "save") {
      return NextResponse.json({ success: false, message: 'Action must be "score" or "save".' }, { status: 400 });
    }

    const projectId = Number(input.projectId);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ success: false, message: "Project is required." }, { status: 400 });
    }
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, session.userId!)),
    });
    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found." }, { status: 404 });
    }

    const normalized = keyword.toLowerCase();
    const found = await db.query.keywords.findFirst({
      where: and(eq(keywords.projectId, projectId), eq(keywords.normalizedKeyword, normalized)),
    });
    let keywordId = found?.id;
    if (!keywordId) {
      const [created] = await db
        .insert(keywords)
        .values({ projectId, keyword, normalizedKeyword: normalized })
        .returning();
      keywordId = created.id;
    }

    const baseSlug =
      h1.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "article";
    const older = await db.query.contents.findMany({
      columns: { id: true },
      where: and(eq(contents.projectId, projectId), eq(contents.keywordId, keywordId)),
    });
    const slug = older.length > 0 ? `${baseSlug}-v${older.length + 1}` : baseSlug;

    const rawHtml = await marked(fullText);
    const bodyHtml = sanitizeHtml(rawHtml, {
      allowedTags: [
        "h1", "h2", "h3", "h4", "p", "ul", "ol", "li",
        "table", "thead", "tbody", "tr", "th", "td",
        "a", "strong", "em", "blockquote", "code", "br", "hr",
      ],
      allowedAttributes: { a: ["href", "title", "rel"], th: ["scope"] },
    });

    const [content] = await db
      .insert(contents)
      .values({
        projectId,
        briefId: null,
        keywordId,
        title: h1,
        h1,
        slug,
        metaTitle: input.metaTitle || "",
        metaDescription: input.metaDescription || "",
        bodyHtml,
        bodyMarkdown: fullText,
        wordCount: validation.words,
        readabilityScore: validation.readability.flesch,
        keywordDensity: validation.keywordDensity,
        qualityScore: validation.qualityScore,
        validationReport: { report: validation.report, checks: validation.report, score: validation.qualityScore },
        status: "draft",
      })
      .returning();

    return NextResponse.json({ success: true, contentId: content.id, validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    const status = /unauthorized|log in|sign in|session|auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
