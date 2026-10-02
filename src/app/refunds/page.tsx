import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Refund Policy", alternates: { canonical: "/refunds" } };

const UPDATED = "30 September 2026";

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Refund Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. The simple version</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Credits never expire — use them whenever you want.</li>
            <li>Failed generation? The credit comes back automatically, no need to ask.</li>
            <li>Bought a pack by mistake and used nothing? Full refund within 7 days of purchase.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Automatic refunds</h2>
          <p className="mt-1">
            If an article generation fails because of our systems (AI outage, server error), the
            1 credit is returned to your balance immediately and recorded in your billing history.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Pack refunds</h2>
          <p className="mt-1">
            Unused credit packs can be refunded in full within 7 days of purchase. Once any
            credit from a pack is used to generate an article, the pack becomes non-refundable,
            because the AI and research cost has already been spent on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Not refundable</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Credits already spent on generated articles.</li>
            <li>Free trial credits (they cost you nothing).</li>
            <li>Accounts closed for fraud, abuse or terms violations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. How to ask</h2>
          <p className="mt-1">
            Email {BUSINESS.email} from your account email with your order date and
            reason. Approved refunds go back to the original payment method within 5-7 business
            days via Razorpay. Please avoid chargebacks — a mail solves it faster for both sides.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Contact</h2>
          <p className="mt-1">
            This service is operated by {BUSINESS.name}, {BUSINESS.addressLines.join(", ")}.
          </p>
        </section>
      </div>
    </div>
  );
}
