import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getAllSettings, SETTING_DEFAULTS } from "@/lib/site-settings";

const ALLOWED = Object.keys(SETTING_DEFAULTS);

function cleanValue(key: string, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (key === "free_credits") {
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
    return String(n);
  }
  if (key === "signups_open") {
    if (v !== "yes" && v !== "no") return null;
    return v;
  }
  if (key === "support_email") {
    if (v !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    if (v.length > 200) return null;
    return v;
  }
  return null;
}

// GET /api/admin/settings — all admin-controlled settings with defaults.
export async function GET() {
  try {
    await requireAdmin();
    const settings = await getAllSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// PATCH /api/admin/settings — { key, value }. One key per call, audited.
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const key = String(body.key || "");
    if (!ALLOWED.includes(key)) {
      return NextResponse.json({ success: false, message: "Unknown setting." }, { status: 400 });
    }
    const value = cleanValue(key, body.value);
    if (value === null) {
      return NextResponse.json({ success: false, message: "Invalid value." }, { status: 400 });
    }
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
    await logAudit({
      adminId: session.userId ?? null,
      adminEmail: session.email ?? "unknown",
      action: "settings.update",
      targetType: "setting",
      targetId: null,
      details: { key, value },
    });
    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden";
    const status = message.includes("REQUIRED") ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
