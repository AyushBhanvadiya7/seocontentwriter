import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, creditsLedger } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "./session";
import { createAdminOtp } from "./admin-otp";
import { getFreeCredits } from "./site-settings";

// Passwords are never stored as plain text.
// bcrypt hash is one-way: login re-hashes the typed password and compares.
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Sign up a new user. New users are always role "user", plan "free".
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const passwordHash = await hashPassword(input.password);
  const FREE_CREDITS = await getFreeCredits();

  const [user] = await db
    .insert(users)
    .values({
      name: input.name.trim(),
      email,
      passwordHash,
      phone: input.phone?.trim() || null,
      credits: FREE_CREDITS,
      role: "user",
      plan: "free",
      timezone: "Asia/Kolkata",
    })
    .returning({ id: users.id, email: users.email, role: users.role, credits: users.credits, name: users.name });

  await db.insert(creditsLedger).values({
    userId: user.id,
    change: FREE_CREDITS,
    reason: "Welcome trial credits",
    balanceAfter: FREE_CREDITS,
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.trim().toLowerCase()),
  });

  // Same message for "email not found" and "wrong password",
  // so attackers cannot discover which emails are registered.
  const GENERIC = "Email or password is incorrect.";
  if (!user) throw new Error(GENERIC);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error(GENERIC);

  if (user.status === "suspended") {
    throw new Error("This account is suspended. Contact support.");
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const session = await getSession();
  // Admins stop here: password done, OTP code still pending.
  if (user.role === "admin") {
    session.pendingAdminId = user.id;
    session.isLoggedIn = false;
    await session.save();
    await createAdminOtp(user.id, user.email, user.name);
    return { id: user.id, email: user.email, role: user.role, name: user.name, credits: user.credits, needOtp: true };
  }

  session.userId = user.id;
  session.email = user.email;
  session.role = user.role as "user" | "admin";
  session.isLoggedIn = true;
  await session.save();

  return { id: user.id, email: user.email, role: user.role, name: user.name, credits: user.credits };
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}

// Returns the logged-in user, or null for guests.
// Never creates accounts silently.
export async function getCurrentUser() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      credits: true,
      plan: true,
      gstin: true,
      phone: true,
      timezone: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return user ?? null;
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found.");

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new Error("Current password is incorrect.");

  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId));

  return true;
}
