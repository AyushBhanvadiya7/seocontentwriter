import crypto from "crypto";

// Password-reset links without any database change.
// The token itself carries (userId + expiry) sealed with SESSION_SECRET,
// so a forged or expired link simply fails verification.

function secret(): string {
  const s = process.env.SESSION_SECRET?.trim();
  if (!s) throw new Error("SESSION_SECRET is not set.");
  return s;
}

export function createResetToken(userId: number): string {
  const exp = Date.now() + 60 * 60 * 1000; // 1 hour
  const body = `${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

// Returns the user id, or null when the link is bad, forged or expired.
export function verifyResetToken(token: string): number | null {
  try {
    const raw = Buffer.from(String(token || ""), "base64url").toString("utf8");
    const [userId, exp, sig] = raw.split(".");
    if (!userId || !exp || !sig) return null;
    if (Date.now() > Number(exp)) return null;
    const expected = crypto.createHmac("sha256", secret()).update(`${userId}.${exp}`).digest("base64url");
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
    const id = parseInt(userId, 10);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}
