import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyWebhookSignature, fulfillOrder } from "@/lib/billing";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// POST /api/billing/webhook — Razorpay calls this on every payment event.
// This is the reliable path (works even if the buyer closes the browser
// before the verify call). Configure it in the Razorpay dashboard with the
// live site URL in step C11. Always answers 200 so Razorpay stops retrying.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, message: "Bad signature." }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; status?: string } } };
    };

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const rzpOrderId = event.payload?.payment?.entity?.order_id || "";
      if (rzpOrderId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.gatewayRef, rzpOrderId),
        });
        // fulfillOrder is idempotent: a second call changes nothing.
        if (order && order.status !== "paid") {
          await fulfillOrder(order.id);
        }
      }
    }
  } catch (error) {
    console.error("Billing webhook error:", error instanceof Error ? error.message : error);
  }

  return NextResponse.json({ received: true });
}
