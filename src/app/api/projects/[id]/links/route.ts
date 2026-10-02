import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { linkLibrary, projects } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_URLS = 200;

// The project's own pages, for internal linking.
// POST accepts pasted URLs or a sitemap URL. The engine reads this table.
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
    const links = await db.query.linkLibrary.findMany({
      where: eq(linkLibrary.projectId, projectId),
    });
    return NextResponse.json({ success: true, links });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    if (message === "AUTH_REQUIRED") {
      return NextResponse.json({ success: false, message: "Login required." }, { status: 401 });
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const body = (await request.json().catch(() => ({}))) as { urls?: unknown; sitemapUrl?: unknown };
    let urls: string[] = [];
    if (typeof body.sitemapUrl === "string" && body.sitemapUrl.trim()) {
      urls = await urlsFromSitemap(body.sitemapUrl.trim());
      if (urls.length === 0) {
        return NextResponse.json(
          { success: false, message: "No URLs found in that sitemap." },
          { status: 400 }
        );
      }
    } else if (Array.isArray(body.urls)) {
      urls = body.urls
        .filter((u): u is string => typeof u === "string")
        .map((u) => u.trim())
        .filter((u) => /^https?:\/\//i.test(u));
    }
    if (urls.length === 0) {
      return NextResponse.json(
        { success: false, message: "Paste at least one http(s) URL, or give a sitemap URL." },
        { status: 400 }
      );
    }

    const existing = await db.query.linkLibrary.findMany({
      where: eq(linkLibrary.projectId, projectId),
    });
    const seen = new Set(existing.map((l) => l.url));
    const fresh: string[] = [];
    for (const u of urls.slice(0, MAX_URLS)) {
      const clean = u.length > 2000 ? u.slice(0, 2000) : u;
      if (!seen.has(clean)) {
        seen.add(clean);
        fresh.push(clean);
      }
    }

    if (fresh.length > 0) {
      await db.insert(linkLibrary).values(
        fresh.map((url) => {
          const slug = slugFromUrl(url);
          const title = titleFromSlug(slug, url);
          return { projectId, url, slug, pageTitle: title, anchorOptions: [title] };
        })
      );
    }
    return NextResponse.json({ success: true, added: fresh.length, skipped: urls.length - fresh.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    if (message === "AUTH_REQUIRED") {
      return NextResponse.json({ success: false, message: "Login required." }, { status: 401 });
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") === "1") {
      const gone = await db
        .delete(linkLibrary)
        .where(eq(linkLibrary.projectId, projectId))
        .returning({ id: linkLibrary.id });
      return NextResponse.json({ success: true, deleted: gone.length });
    }
    const linkId = parseInt(searchParams.get("id") || "", 10);
    if (!Number.isFinite(linkId)) {
      return NextResponse.json({ success: false, message: "Invalid link id." }, { status: 400 });
    }
    const gone = await db
      .delete(linkLibrary)
      .where(and(eq(linkLibrary.id, linkId), eq(linkLibrary.projectId, projectId)))
      .returning({ id: linkLibrary.id });
    if (gone.length === 0) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted: 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed.";
    if (message === "AUTH_REQUIRED") {
      return NextResponse.json({ success: false, message: "Login required." }, { status: 401 });
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// Last URL path part becomes the slug: /blog/best-safari/ -> best-safari.
function slugFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "");
    const last = path.split("/").filter(Boolean).pop() || "home";
    return decodeURIComponent(last).slice(0, 500);
  } catch {
    return url.slice(0, 500);
  }
}

// best-lion-safari -> Best Lion Safari (used as link text by the engine).
function titleFromSlug(slug: string, url: string): string {
  const words = slug.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
  if (!words || words.toLowerCase() === "home") {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "Home";
    }
  }
  return words
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 500);
}

// Reads <loc> URLs from a sitemap (follows sitemap-index files too).
async function urlsFromSitemap(sitemapUrl: string): Promise<string[]> {
  async function fetchLocs(url: string): Promise<string[]> {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const locs: string[] = [];
    const re = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const loc = m[1].trim();
      if (/^https?:\/\//i.test(loc)) locs.push(loc);
      if (locs.length >= MAX_URLS) break;
    }
    return locs;
  }

  const first = await fetchLocs(sitemapUrl);
  const nested = first.filter((u) => /\.xml(\?.*)?$/i.test(u));
  if (nested.length > 0 && first.length === nested.length) {
    const seen = new Set<string>();
    for (const child of nested.slice(0, 5)) {
      for (const u of await fetchLocs(child)) {
        if (!/\.xml(\?.*)?$/i.test(u)) seen.add(u);
        if (seen.size >= MAX_URLS) break;
      }
      if (seen.size >= MAX_URLS) break;
    }
    return [...seen];
  }
  return first.filter((u) => !/\.xml(\?.*)?$/i.test(u)).slice(0, MAX_URLS);
}
