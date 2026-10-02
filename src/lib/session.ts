import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: number;
  email?: string;
  role?: "user" | "admin";
  pendingAdminId?: number;
  isLoggedIn: boolean;
}

// Session secret: must be 32+ random characters.
// Fails loudly in production when missing or short.
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET is missing or too short (32+ characters required). Add it in Vercel > Settings > Environment Variables."
      );
    }
    console.warn(
      "SESSION_SECRET is not set (or shorter than 32 chars). This is allowed in development only."
    );
  }

  return secret || "dev-only-secret-do-not-use-in-production-please";
}

export const sessionOptions: SessionOptions = {
  cookieName: "seo_writer_session",
  password: getSessionSecret(),
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Throws AUTH_REQUIRED when not logged in. Never auto-logs-in anyone.
export async function requireAuth(): Promise<IronSession<SessionData>> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    throw new Error("AUTH_REQUIRED");
  }

  return session;
}

// Throws ADMIN_REQUIRED when the user is not an admin.
export async function requireAdmin(): Promise<IronSession<SessionData>> {
  const session = await requireAuth();

  if (session.role !== "admin") {
    throw new Error("ADMIN_REQUIRED");
  }

  return session;
}

// Returns the session or null. For UI that works for guests too (e.g. navbar).
export async function getOptionalSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
    isLoggedIn: true,
  };
}
