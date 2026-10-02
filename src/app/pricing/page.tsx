"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Coins } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CARDS = [
  {
    id: "starter",
    name: "Starter",
    price: "499",
    credits: 25,
    perArticle: "20 per article",
    features: ["25 articles", "Real Google research", "Word + HTML export", "Email support"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "1,499",
    credits: 100,
    perArticle: "15 per article",
    features: ["100 articles", "Real Google research", "Word + HTML export", "Priority support"],
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "3,999",
    credits: 300,
    perArticle: "13 per article",
    features: ["300 articles", "Real Google research", "Word + HTML export", "Dedicated support"],
    highlight: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMe(data.user);
      })
      .catch(() => {});
  }, []);

  function loadCheckout(): Promise<void> {
    if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load the payment window."));
      document.body.appendChild(script);
    });
  }

  async function buy(planId: string) {
    if (!me) {
      router.push("/login");
      return;
    }
    setBuying(planId);
    setMessage(null);
    try {
      const orderRes = await fetch("/api/billing/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const order = await orderRes.json();
      if (!order.success) throw new Error(order.message || "Could not create order.");

      await loadCheckout();

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "SEO Content Writer",
        description: `${order.planName} pack — ${order.credits} credits`,
        prefill: { email: me.email || "", name: me.name || "" },
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const result = await verifyRes.json();
            if (!result.success) {
              setMessage({ ok: false, text: result.message || "Verification failed." });
              return;
            }
            setMe({ ...me, credits: result.balance });
            setMessage({ ok: true, text: `${result.credits} credits added. New balance: ${result.balance}.` });
          } catch {
            setMessage({ ok: false, text: "Payment done, but confirmation failed. Credits will arrive via webhook — check balance in a minute." });
          } finally {
            setBuying(null);
          }
        },
        modal: { ondismiss: () => setBuying(null) },
      });
      rzp.on("payment.failed", () => {
        setBuying(null);
        setMessage({ ok: false, text: "Payment failed. No money was taken." });
      });
      rzp.open();
    } catch (error) {
      setBuying(null);
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
        <p className="mt-2 text-slate-600">1 credit = 1 article. New accounts start with 10 free credits.</p>
        {me && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Coins className="h-4 w-4" /> Your balance: {me.credits} credits
          </p>
        )}
      </div>

      {message && (
        <div
          className={`mx-auto mt-6 max-w-2xl rounded-lg border px-4 py-3 text-sm ${
            message.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
          {message.ok && (
            <Link href="/dashboard" className="ml-2 font-semibold underline">
              Go to dashboard
            </Link>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className={`rounded-xl border bg-white p-6 shadow-sm ${
              card.highlight ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
            }`}
          >
            {card.highlight && (
              <p className="mb-2 inline-block rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                Most popular
              </p>
            )}
            <h2 className="text-lg font-semibold text-slate-900">{card.name}</h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              <span className="text-xl">Rs.</span> {card.price}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {card.credits} credits · Rs. {card.perArticle}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {card.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => buy(card.id)}
              disabled={buying !== null}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                card.highlight ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {buying === card.id && <Loader2 className="h-4 w-4 animate-spin" />}
              {buying === card.id ? "Opening payment..." : me ? `Buy ${card.name}` : "Log in to buy"}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Secure payments by Razorpay. Credits never expire. Refunds as per our refund policy.
      </p>
       <p className="mt-2 text-center text-xs text-slate-500">
        Prices include GST. Razorpay emails a payment receipt after every purchase.
      </p>x
    </div>
  );
}