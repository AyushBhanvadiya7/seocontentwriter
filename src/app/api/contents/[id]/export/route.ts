import { NextResponse } from "next/server";
import { db } from "@/db";
import { contents, exports } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/contents/[id]/export?format=docx
// Builds a Word (.docx) file from the article and downloads it.
// Every export is logged in the exports table.
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
    const contentId = parseInt(id, 10);

    if (!Number.isFinite(contentId)) {
      return NextResponse.json({ success: false, message: "Invalid content id." }, { status: 400 });
    }

    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "docx").toLowerCase();
    if (format !== "docx") {
      return NextResponse.json(
        { success: false, message: "Only format=docx is supported here. Markdown and HTML download directly in the browser." },
        { status: 400 }
      );
    }

    const content = await db.query.contents.findFirst({
      where: eq(contents.id, contentId),
      with: { project: true },
    });

    if (!content || content.project?.userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
    }

    const buffer = await buildDocx({
      title: content.title || "Untitled article",
      metaDescription: content.metaDescription || "",
      markdown: content.bodyMarkdown || "",
    });

    await db.insert(exports).values({
      contentId: content.id,
      userId: session.userId!,
      format: "docx",
      target: "download",
      meta: { words: content.wordCount || 0, title: content.title },
    });

    const filename = `${(content.slug || `article-${content.id}`).replace(/[^a-z0-9-]+/gi, "-")}.docx`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    if (message === "AUTH_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Your login expired. Please log in again, then retry the download." },
        { status: 401 }
      );
    }
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// Converts article markdown into Word paragraphs.
function runsFromInline(text: string, forceBold = false): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  if (parts.length === 0) return [new TextRun({ text: "" })];
  return parts.map((p) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return new TextRun({ text: p.slice(2, -2), bold: true });
    }
    return new TextRun({ text: p.replace(/[*_`~]/g, ""), bold: forceBold || undefined });
  });
}

function tableFromRows(rows: string[][]): Table {
  // Word needs every row to have the same cell count.
  // Ragged AI tables are padded so the file always opens.
  const width = Math.max(...rows.map((r) => r.length), 1);
  const even = rows.map((r) => (r.length < width ? [...r, ...Array<string>(width - r.length).fill("")] : r));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: even.map(
      (cells, rowIndex) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ children: runsFromInline(cell, rowIndex === 0) })],
              })
          ),
        })
    ),
  });
}

async function buildDocx(input: { title: string; metaDescription: string; markdown: string }): Promise<Buffer> {
  const children: Array<Paragraph | Table> = [];

  children.push(new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }));
  if (input.metaDescription) {
    children.push(new Paragraph({ children: [new TextRun({ text: input.metaDescription, italics: true, color: "555555" })] }));
  }
  children.push(new Paragraph({ text: "" }));

  const lines = input.markdown.split("\n");
  let tableBuffer: string[][] = [];

  function flushTable() {
    if (tableBuffer.length > 0) {
      children.push(tableFromRows(tableBuffer));
      tableBuffer = [];
    }
  }

  let skippedFirstH1 = false;
  const cleanDocTitle = input.title.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Table rows are grouped and flushed together.
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      const isSeparator = cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
      if (!isSeparator) tableBuffer.push(cells);
      continue;
    }
    flushTable();

    if (!line || line === "---" || line === "***") continue;

    if (line.startsWith("#### ")) {
      children.push(
        new Paragraph({
          children: runsFromInline(line.slice(5).trim(), true),
          heading: HeadingLevel.HEADING_4,
        })
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: runsFromInline(line.slice(4).trim(), true),
          heading: HeadingLevel.HEADING_3,
        })
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          children: runsFromInline(line.slice(3).trim(), true),
          heading: HeadingLevel.HEADING_2,
        })
      );
    } else if (line.startsWith("# ")) {
      const h1Text = line.slice(2).trim();
      const cleanH1 = h1Text.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Only skip the first H1 if it closely matches the document title
      if (!skippedFirstH1 && (cleanDocTitle === cleanH1 || cleanDocTitle.includes(cleanH1) || cleanH1.includes(cleanDocTitle))) {
        skippedFirstH1 = true;
        continue;
      }
      children.push(
        new Paragraph({
          children: runsFromInline(h1Text, true),
          heading: HeadingLevel.HEADING_1,
        })
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      children.push(
        new Paragraph({ children: runsFromInline(line.slice(2)), bullet: { level: 0 } })
      );
    } else if (/^\d+\.\s/.test(line)) {
      children.push(new Paragraph({ children: runsFromInline(line.replace(/^\d+\.\s/, "")) }));
    } else if (line.startsWith("> ")) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: line.slice(2), italics: true, color: "475569" })] })
      );
    } else {
      children.push(new Paragraph({ children: runsFromInline(line) }));
    }
  }
  flushTable();

  const doc = new Document({
    title: input.title,
    description: input.metaDescription || undefined,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 24, // 12pt
            color: "1e293b",
          },
          paragraph: {
            spacing: { after: 140, line: 276 },
          },
        },
        heading1: {
          run: {
            font: "Calibri",
            size: 38, // 19pt
            bold: true,
            color: "0f172a",
          },
          paragraph: {
            spacing: { before: 320, after: 140 },
          },
        },
        heading2: {
          run: {
            font: "Calibri",
            size: 30, // 15pt
            bold: true,
            color: "1e3a8a",
          },
          paragraph: {
            spacing: { before: 260, after: 120 },
          },
        },
        heading3: {
          run: {
            font: "Calibri",
            size: 25, // 12.5pt
            bold: true,
            color: "334155",
          },
          paragraph: {
            spacing: { before: 200, after: 100 },
          },
        },
        heading4: {
          run: {
            font: "Calibri",
            size: 23, // 11.5pt
            bold: true,
            color: "475569",
          },
          paragraph: {
            spacing: { before: 160, after: 80 },
          },
        },
        title: {
          run: {
            font: "Calibri",
            size: 46, // 23pt
            bold: true,
            color: "0f172a",
          },
          paragraph: {
            spacing: { before: 100, after: 160 },
          },
        },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
