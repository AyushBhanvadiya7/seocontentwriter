import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { PLANS, razorpay, type PlanId } from "@/lib/billing";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

// POST /api/billing/order  { plan: "starter" | "pro" | "agency" }
// Creates a Razorpay order + a pending row in our orders table.
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    // Order-spam guard: 5 orders per minute per user.
    const gate = checkRateLimit(`order:${session.userId}`, 5, 60_000);
    if (!gate.allowed) {
      return NextResponse.json({ success: false, message: "Too many orders. Wait a minute and try again." }, { status: 429 });
    }
    
    const { plan } = await request.json().catch(() => ({}));
    const selected = PLANS[plan as PlanId];

    if (!selected) {
      return NextResponse.json({ success: false, message: "Unknown plan." }, { status: 400 });
    }

    const rzp = razorpay();
    const rzpOrder = await rzp.orders.create({
      amount: selected.amountPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: { plan: String(plan), userId: String(session.userId) },
    });

    await db.insert(orders).values({
      userId: session.userId!,
      plan: String(plan),
      amount: selected.amountPaise,
      currency: "INR",
      gateway: "razorpay",
      gatewayRef: rzpOrder.id,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      orderId: rzpOrder.id,
      amount: selected.amountPaise,
      currency: "INR",
      planName: selected.name,
      credits: selected.credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
