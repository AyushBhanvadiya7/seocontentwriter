import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { verifyPaymentSignature, fulfillOrder } from "@/lib/billing";
import { eq, and } from "drizzle-orm";

// POST /api/billing/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Called by the pricing page after Razorpay Checkout succeeds.
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json().catch(() => ({}));

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Incomplete payment details." }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.gatewayRef, String(razorpay_order_id)), eq(orders.userId, session.userId!)),
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const valid = verifyPaymentSignature(
      String(razorpay_order_id),
      String(razorpay_payment_id),
      String(razorpay_signature)
    );
    if (!valid) {
      return NextResponse.json({ success: false, message: "Payment signature is invalid." }, { status: 400 });
    }

    const result = await fulfillOrder(order.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
