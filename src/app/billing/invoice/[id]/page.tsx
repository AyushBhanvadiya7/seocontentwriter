import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/billing";
import { BUSINESS } from "@/lib/business";
import { PrintButton } from "./PrintButton";

function invoiceNo(id: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(id).padStart(6, "0")}`;
}

function rupees(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

// GET /billing/invoice/[id] — printable receipt for one order.
// Only the owner can see it; everyone else gets a 404.
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isFinite(orderId)) notFound();

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.userId !== user.id) notFound();

  const plan = PLANS[order.plan as PlanId];
  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/billing" className="text-sm font-semibold text-blue-600 hover:underline">
          Back to billing
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">Receipt</p>
            <p className="mt-1 text-sm text-slate-600">{invoiceNo(order.id)}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold uppercase ${
              paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">From</p>
            <p className="mt-1 font-medium text-slate-900">{BUSINESS.name}</p>
            {BUSINESS.addressLines.map((line) => (
              <p key={line} className="text-slate-600">
                {line}
              </p>
            ))}
            <p className="text-slate-600">{BUSINESS.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Billed to</p>
            <p className="mt-1 font-medium text-slate-900">{user.name}</p>
            <p className="text-slate-600">{user.email}</p>
            <p className="mt-2 text-slate-600">
              Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-y border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-slate-800">
                {plan ? plan.name : order.plan} plan — {plan ? plan.credits : "?"} credits
              </td>
              <td className="py-3 text-right text-slate-800">{rupees(order.amount)}</td>
            </tr>
            <tr>
              <td className="py-3 font-semibold text-slate-900">Total</td>
              <td className="py-3 text-right font-semibold text-slate-900">{rupees(order.amount)}</td>
            </tr>
          </tbody>
        </table>

        {order.gatewayRef && (
          <p className="mt-2 text-xs text-slate-500">Payment ref: {order.gatewayRef}</p>
        )}
        <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
          Computer-generated receipt. For invoice queries, contact {BUSINESS.email}
        </p>
      </div>
    </div>
  );
}
