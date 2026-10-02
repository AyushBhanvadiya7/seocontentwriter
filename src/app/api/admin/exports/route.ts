import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, orders, contents, keywords, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { asc, inArray } from "drizzle-orm";

const TYPES = ["users", "orders", "articles"] as const;
type ExportType = (typeof TYPES)[number];
const LIMIT = 5000;

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  return "﻿" + lines.join("\r\n");
}

function fileName(type: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `${type}-${d}.csv`;
}

// GET /api/admin/exports?type=users|orders|articles — CSV file download.
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const type = request.nextUrl.searchParams.get("type") as ExportType | null;
    if (!type || !(TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ success: false, message: "Unknown export type." }, { status: 400 });
    }

    let out = "";
    let rows = 0;
    if (type === "users") {
      const list = await db.query.users.findMany({ orderBy: asc(users.id), limit: LIMIT });
      rows = list.length;
      out = csv(
        ["id", "name", "email", "role", "plan", "credits", "status", "created_at"],
        list.map((u) => [u.id, u.name, u.email, u.role, u.plan, u.credits, u.status, u.createdAt.toISOString()])
      );
    } else if (type === "orders") {
      const list = await db.query.orders.findMany({ orderBy: asc(orders.id), limit: LIMIT });
      const ids = Array.from(new Set(list.map((o) => o.userId)));
      const urows =
        ids.length > 0
          ? await db.query.users.findMany({
              where: inArray(users.id, ids),
              columns: { id: true, email: true },
            })
          : [];
      const emailById = new Map(urows.map((u) => [u.id, u.email]));
      rows = list.length;
      out = csv(
        ["id", "user_email", "plan", "amount_inr", "status", "gateway", "gateway_ref", "created_at"],
        list.map((o) => [
          o.id,
          emailById.get(o.userId) || "",
          o.plan,
          (o.amount / 100).toFixed(2),
          o.status,
          o.gateway || "",
          o.gatewayRef || "",
          o.createdAt.toISOString(),
        ])
      );
    } else {
      const list = await db.query.contents.findMany({ orderBy: asc(contents.id), limit: LIMIT });
      const kid = Array.from(new Set(list.map((c) => c.keywordId)));
      const pid = Array.from(new Set(list.map((c) => c.projectId)));
      const krows =
        kid.length > 0
          ? await db.query.keywords.findMany({
              where: inArray(keywords.id, kid),
              columns: { id: true, keyword: true },
            })
          : [];
      const prows =
        pid.length > 0
          ? await db.query.projects.findMany({
              where: inArray(projects.id, pid),
              columns: { id: true, name: true, userId: true },
            })
          : [];
      const uids = Array.from(new Set(prows.map((p) => p.userId)));
      const urows =
        uids.length > 0
          ? await db.query.users.findMany({
              where: inArray(users.id, uids),
              columns: { id: true, email: true },
            })
          : [];
      const kwById = new Map(krows.map((k) => [k.id, k.keyword]));
      const projById = new Map(prows.map((p) => [p.id, p]));
      const emailById = new Map(urows.map((u) => [u.id, u.email]));
      rows = list.length;
      out = csv(
        ["id", "title", "keyword", "project", "user_email", "status", "words", "created_at"],
        list.map((c) => {
          const p = projById.get(c.projectId);
          return [
            c.id,
            c.title || "",
            kwById.get(c.keywordId) || "",
            p?.name || "",
            p ? emailById.get(p.userId) || "" : "",
            c.status,
            c.wordCount ?? 0,
            c.createdAt.toISOString(),
          ];
        })
      );
    }

    await logAudit({
      adminId: session.userId ?? null,
      adminEmail: session.email ?? "unknown",
      action: "exports.download",
      targetType: "export",
      targetId: null,
      details: { type, rows },
    });

    return new NextResponse(out, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName(type)}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
