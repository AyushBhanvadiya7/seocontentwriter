import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

const UPDATED = "30 September 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. What we collect</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Account details: name, email, phone (optional) and password (stored as a one-way hash, never plain text).</li>
            <li>Your work: projects, keywords, briefs, articles and uploads.</li>
            <li>Payments: plan, amount and order status. Card/UPI details go only to Razorpay, never to us.</li>
            <li>Technical: login sessions, error logs and basic usage counts for security and billing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. How we use it</h2>
          <p className="mt-1">
            To run your account, generate your articles, process payments, send login and billing
            emails, prevent fraud and improve the service. We never sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Who processes your data</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Razorpay — payments (India).</li>
            <li>Resend — transactional email (welcome, password reset).</li>
            <li>Google Gemini API — article generation (your keyword/topic is sent to the AI model).</li>
            <li>Serper — Google search results for research (only the keyword is sent).</li>
            <li>Hosting/database providers — to store and serve the app.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Cookies</h2>
          <p className="mt-1">
            We use one strictly-necessary cookie to keep you logged in. No advertising or
            cross-site tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Storage and retention</h2>
          <p className="mt-1">
            Data is stored securely with access controls. We keep account and billing records as
            long as your account exists (and as tax law requires afterwards). You can ask for
            export or deletion any time at the email below; billing records required by law are
            kept in anonymised form.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Children</h2>
          <p className="mt-1">The service is not for children under 13. Accounts found to belong to children will be closed.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">7. Contact</h2>
          <p className="mt-1">
            This service is operated by {BUSINESS.name}, {BUSINESS.addressLines.join(", ")}.
            Privacy questions or deletion requests: {BUSINESS.email}
          </p>
        </section>
      </div>
    </div>
  );
}
