import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Single source of truth for admin-controlled site settings.
// Every reader has a safe fallback: a missing row or a DB hiccup
// must never break signup, login, or the contact form.
export const SETTING_DEFAULTS: Record<string, string> = {
  free_credits: "10",
  signups_open: "yes",
  support_email: "",
};

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });
    if (row) return row.value;
  } catch (error) {
    console.error("[settings:read-failed]", key, error);
  }
  return SETTING_DEFAULTS[key] ?? "";
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...SETTING_DEFAULTS };
  try {
    const rows = await db.query.siteSettings.findMany();
    for (const r of rows) {
      if (r.key in out) out[r.key] = r.value;
    }
  } catch (error) {
    console.error("[settings:read-all-failed]", error);
  }
  return out;
}

export async function getFreeCredits(): Promise<number> {
  const raw = await getSetting("free_credits");
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0 || n > 1000) return 10;
  return n;
}

export async function signupsOpen(): Promise<boolean> {
  return (await getSetting("signups_open")) !== "no";
}

export async function getSupportEmail(): Promise<string> {
  const custom = (await getSetting("support_email")).trim();
  if (custom && custom.includes("@")) return custom;
  return process.env.CONTACT_TO || "support@seocontentwriter.com";
}
