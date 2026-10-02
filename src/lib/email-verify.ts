import crypto from "crypto";

// Email-verify links without any database change.
// The token itself carries (purpose + userId + expiry) sealed with
// SESSION_SECRET, so a forged or expired link simply fails verification.
// (Same pattern as password-reset, different purpose string.)

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (!s) throw new Error("SESSION_SECRET is not set.");
  return s;
}

export function createEmailVerifyToken(userId: number): string {
  const exp = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const body = `email-verify.${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

// Returns the user id, or null when the link is bad, forged or expired.
export function verifyEmailToken(token: string): number | null {
  try {
    const raw = Buffer.from(String(token || ""), "base64url").toString("utf8");
    const [purpose, userId, exp, sig] = raw.split(".");
    if (purpose !== "email-verify" || !userId || !exp || !sig) return null;
    if (Date.now() > Number(exp)) return null;
    const expected = crypto
      .createHmac("sha256", secret())
      .update(`email-verify.${userId}.${exp}`)
      .digest("base64url");
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const id = parseInt(userId, 10);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}