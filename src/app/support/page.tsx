import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "Answers about credits, AI vs Humanized vs Human articles, SEO score, invoices and your account.",
  alternates: { canonical: "/support" },
};

const FAQS = [
  {
    q: "How many credits does an article cost?",
    a: "One AI article costs 1 credit, in AI mode or Humanized mode. Human articles (you write, we score) are free forever and never touch your credits.",
  },
  {
    q: "What is the difference between AI, Humanized and Human?",
    a: "AI content is the standard fast article. Humanized uses extra human-voice rules and livelier wording so it reads naturally. Human means you write every word yourself and the site only gives you a live SEO score.",
  },
  {
    q: "If I generate twice on the same keyword, will I get the same article?",
    a: "No. Every repeat run is treated as a new version (v2, v3...) with a fresh angle, new examples and new wording — and its own link. Facts may overlap, because facts are facts.",
  },
  {
    q: "What does the SEO score check?",
    a: "Seven checks: exactly one H1, at least 4 H2 sections, word target, keyword density between 0.4% and 2%, short sentences, meta title length (30-65) and meta description length (120-165). It is pure maths — no AI key needed.",
  },
  {
    q: "Do I need my own AI key?",
    a: "No. AI generation is included in your credits. You never need to buy or paste any AI key.",
  },
  {
    q: "Can I edit or delete my articles?",
    a: "Yes. Open any article to edit the title, meta tags or text, change its status (draft, approved, published) or delete it. You can also search, filter and delete from the Library.",
  },
  {
    q: "Will my article pass AI detectors?",
    a: "Humanized mode is built to read fully human, and Human mode has zero AI by definition. No tool can promise a score on every detector, because every detector works differently — always review before you publish.",
  },
  {
    q: "How do invoices and GST work?",
    a: "Every paid order gets a receipt from the billing page. GST invoices carry your GSTIN when you add it at checkout. Paid credits never expire.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings, scroll to Delete account, type DELETE and confirm. This erases your account, projects, articles, keywords and orders forever.",
  },
  {
    q: "I still need help. Where do I ask?",
    a: "Use the contact page and pick the Support issue type. We read every message.",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Help & FAQ</h1>
      <p className="mt-1 text-sm text-slate-600">
        Quick answers. Still stuck?{" "}
        <Link href="/contact" className="font-medium text-blue-600 hover:underline">
          Contact support
        </Link>
        .
      </p>
      <div className="mt-6 space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-slate-200 bg-white shadow-sm open:ring-1 open:ring-blue-200"
          >
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-slate-900 marker:text-slate-400">
              {f.q}
            </summary>
            <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
