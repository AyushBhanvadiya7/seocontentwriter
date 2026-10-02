import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

const UPDATED = "30 September 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. The service</h2>
          <p className="mt-1">
            SEO Content Writer is an AI-assisted writing tool. You give keywords and topics; the
            service researches the web and drafts SEO articles with meta tags, schema, links and
            image prompts. AI output must always be reviewed by a human before publishing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. Accounts</h2>
          <p className="mt-1">
            You must give a valid email address and keep your password secret. One account per
            person for the free trial. You are responsible for everything done from your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Credits and payments</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>1 credit makes 1 article. New accounts get 10 free credits.</li>
            <li>Paid credit packs never expire and work until fully used.</li>
            <li>Prices are in Indian Rupees (INR), taxes extra where applicable.</li>
            <li>Payments are processed securely by Razorpay; we never see or store your card or UPI details.</li>
            <li>If a generation fails because of our systems, the credit is refunded automatically.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. No ranking guarantees</h2>
          <p className="mt-1">
            We help you write better content, but no tool can promise Google rankings, traffic or
            revenue. Search results depend on competition, your website, links and many factors
            outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Your content</h2>
          <p className="mt-1">
            Articles generated from your account belong to you. You may publish, edit and sell
            them. You agree not to generate spam, hateful, illegal, deceptive or infringing
            content, and not to abuse the service with automated bulk requests.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Fair use and termination</h2>
          <p className="mt-1">
            We may rate-limit, suspend or close accounts that abuse the service, attempt fraud,
            attack other users, or break these terms. Paid but unused credits in closed-abuse
            accounts are not refunded.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">7. Availability and liability</h2>
          <p className="mt-1">
            We aim for high availability but do not promise uninterrupted service. To the maximum
            extent allowed by law, our total liability is limited to the amount you paid in the
            3 months before the claim. We are not liable for indirect losses such as lost
            rankings, traffic or profit.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">8. Changes and law</h2>
          <p className="mt-1">
            We may update these terms; continued use after changes means acceptance. These terms
            are governed by the laws of India, with courts at Ahmedabad, Gujarat having jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">9. Contact</h2>
          <p className="mt-1">
            This service is operated by {BUSINESS.name}, {BUSINESS.addressLines.join(", ")}.
            Questions about these terms: {BUSINESS.email}
          </p>
        </section>
      </div>
    </div>
  );
}
