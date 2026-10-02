import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "@/db";
import { users, orders, creditsLedger } from "@/db/schema";
import { eq } from "drizzle-orm";

// Credit packs. 1 credit = 1 article. Razorpay takes paise (1 INR = 100 paise).
export const PLANS = {
  starter: {
    name: "Starter",
    priceInr: 499,
    amountPaise: 49900,
    credits: 25,
    features: ["25 articles", "Real Google research", "Word + HTML export", "Email support"],
  },
  pro: {
    name: "Pro",
    priceInr: 1499,
    amountPaise: 149900,
    credits: 100,
    features: ["100 articles", "Real Google research", "Word + HTML export", "Priority support"],
  },
  agency: {
    name: "Agency",
    priceInr: 3999,
    amountPaise: 399900,
    credits: 300,
    features: ["300 articles", "Real Google research", "Word + HTML export", "Dedicated support"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not set. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.");
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

// Verifies the signature Razorpay Checkout sends after payment.
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Verifies the signature Razorpay sends with webhook events.
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Marks a pending order paid, adds credits, writes the ledger, upgrades the plan.
// Safe to call twice (webhook + verify racing) — the second call is a no-op.
export async function fulfillOrder(dbOrderId: number): Promise<{ alreadyPaid: boolean; credits: number; balance: number }> {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, dbOrderId) });
  if (!order) throw new Error("Order not found.");
  if (order.status === "paid") {
    const owner = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
    return { alreadyPaid: true, credits: 0, balance: owner?.credits ?? 0 };
  }

  const plan = PLANS[order.plan as PlanId];
  if (!plan || order.amount !== plan.amountPaise) {
    await db.update(orders).set({ status: "failed" }).where(eq(orders.id, dbOrderId));
    throw new Error("Order amount mismatch. Contact support.");
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  if (!user) throw new Error("User not found.");

  const newBalance = user.credits + plan.credits;
  await db.update(orders).set({ status: "paid" }).where(eq(orders.id, dbOrderId));
  await db
    .update(users)
    .set({ credits: newBalance, plan: order.plan as "starter" | "pro" | "agency" })
    .where(eq(users.id, user.id));
  await db.insert(creditsLedger).values({
    userId: user.id,
    change: plan.credits,
    reason: `${plan.name} pack purchased (order #${dbOrderId})`,
    referenceId: dbOrderId,
    balanceAfter: newBalance,
  });

  return { alreadyPaid: false, credits: plan.credits, balance: newBalance };
}
