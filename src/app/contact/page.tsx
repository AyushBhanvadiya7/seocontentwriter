export const metadata = { title: "Contact", alternates: { canonical: "/contact" } };
import ContactForm from "./ContactForm";
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
      <p className="mt-2 text-sm text-slate-600">
        We reply within 1 business day (Monday-Saturday, India time).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Support</h2>
          <p className="mt-1 text-sm text-slate-600">Login, credits, articles, exports.</p>
          <p className="mt-2 text-sm font-medium text-blue-600">support@seocontentwriter.com</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Billing</h2>
          <p className="mt-1 text-sm text-slate-600">Payments, invoices, refunds.</p>
          <p className="mt-2 text-sm font-medium text-blue-600">support@seocontentwriter.com</p>
        </div>
      </div>
 <ContactForm />
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Before you write</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Forgot password? Use the &quot;Forgot password?&quot; link on the login page.</li>
          <li>Missing credits? Check Billing — every movement is listed there.</li>
          <li>Payment stuck? Write with your payment date and the email on your account.</li>
        </ul>
      </div>
    </div>
  );
}
