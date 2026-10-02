import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminOtps } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sendEmail } from "./email";

// Create a 6-digit admin login code, store its hash, and email it.
// The plain code is never stored. In dev the code is also printed
// to the terminal so testing never needs an inbox.
export async function createAdminOtp(userId: number, email: string, name: string): Promise<boolean> {
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(adminOtps).values({ userId, codeHash, expiresAt });

  const subject = "Your admin login code";
  const text = `Hi ${name},\n\nYour admin login code is: ${code}\nValid for 10 minutes. Never share this code.\n\n— SEO Content Writer`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
    <h2 style="color: #1d4ed8;">Your admin login code</h2>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${code}</p>
    <p>Valid for <strong>10 minutes</strong>. Never share this code.</p>
  </div>`;

  const mailed = await sendEmail(email, subject, html, text);
  console.log(`[admin-otp] user=${userId} mailed=${mailed}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`[admin-otp:dev-code] user=${userId} code=${code}`);
  }
  return mailed;
}

// Verify a code. Single-use, 10-minute expiry, max 5 attempts.
// Returns true exactly once per code.
export async function verifyAdminOtp(userId: number, code: string): Promise<boolean> {
  const clean = String(code || "").trim();
  if (!/^\d{6}$/.test(clean)) return false;

  const rows = await db.query.adminOtps.findMany({
    where: and(eq(adminOtps.userId, userId), isNull(adminOtps.usedAt)),
    orderBy: desc(adminOtps.createdAt),
    limit: 1,
  });
  const row = rows[0];
  if (!row) return false;
  if (row.attempts >= 5) return false;
  if (row.expiresAt.getTime() < Date.now()) return false;

  const ok = await bcrypt.compare(clean, row.codeHash);
  if (!ok) {
    await db.update(adminOtps).set({ attempts: row.attempts + 1 }).where(eq(adminOtps.id, row.id));
    return false;
  }
  await db.update(adminOtps).set({ usedAt: new Date() }).where(eq(adminOtps.id, row.id));
  return true;
}
