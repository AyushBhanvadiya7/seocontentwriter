import Link from "next/link";
import { ArrowRight, CheckCircle, Coins, PenLine, RotateCcw, Sparkles } from "lucide-react";

// Public SEO landing page: article generator and credits.
// Marketing page only. Generation itself stays inside a logged-in project.
export const metadata = {
  title: "One Credit Writes One Full SEO Article",
  description:
    "Generate a researched SEO article for 1 credit. AI or humanized, same price. Paid credits never expire. Start with 10 free articles.",
  alternates: { canonical: "/features/ai-article-generator" },
};

const INCLUDED = [
  {
    icon: Sparkles,
    title: "A full article, not an outline",
    text: "One credit returns the draft, meta title, meta description, FAQ, links, image prompts and a quality score.",
  },
  {
    icon: Coins,
    title: "Credits never expire",
    text: "Paid credits stay on the account until you use them. A week later or a year later, same balance.",
  },
  {
    icon: PenLine,
    title: "AI or humanized, same credit",
    text: "Pick either mode in the generate box. Humanized aims for plainer wording. It is still 1 credit.",
  },
  {
    icon: RotateCcw,
    title: "A failed run gives the credit back",
    text: "If our systems fail, the credit returns automatically. You do not email support to get it.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick a keyword on the project",
    text: "The keyword should already be in the project. Add secondary keywords or a short note if you want.",
  },
  {
    n: "2",
    title: "Choose AI or Humanized",
    text: "Both cost 1 credit. The box estimates about 2 to 3 minutes. That is an estimate, not a stopwatch promise.",
  },
  {
    n: "3",
    title: "Read it, then export",
    text: "The article opens in the editor. Change what you dislike, save, and download Word, HTML or Markdown.",
  },
];

const FAQS = [
  {
    q: "Do credits expire?",
    a: "No. Paid credits stay until you spend them. There is no monthly reset and no subscription you must cancel.",
  },
  {
    q: "What does 1 credit include?",
    a: "One researched article plus meta tags, FAQ schema, internal and external links, image prompts with alt text, a quality score, and export. It does not publish the page on your site.",
  },
  {
    q: "Does humanized mean 0% on an AI detector?",
    a: "No. Detectors disagree with each other. Humanized is plainer wording, same 1 credit. You should still read the draft.",
  },
  {
    q: "Will it rank, and what if generation fails?",
    a: "No tool can promise a Google ranking. If generation fails on our side, the 1 credit comes back. Unused packs can be refunded within 7 days if you used nothing.",
  },
];

const RELATED = [
  { slug: "keyword-research", title: "Keyword research" },
  { slug: "brand-voice", title: "Brand voice" },
  { slug: "meta-schema", title: "Meta tags + schema" },
  { slug: "word-export", title: "Word, HTML, Markdown" },
];

export default function AiArticleGeneratorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">AI article generator</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        One credit writes a full article. That credit never expires.
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Pick a keyword, choose AI or humanized, and wait about 2 to 3 minutes.
        You get the draft and the SEO extras. You still edit before you publish.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          Start free — 10 articles <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
        >
          View pricing
        </Link>
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">What you get</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {INCLUDED.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <item.icon className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">How it works</h2>
      <ol className="mt-4 space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {s.n}
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">Common questions</h2>
      <div className="mt-4 space-y-3">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">{f.q}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.a}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">Keep exploring</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {RELATED.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/features/${r.slug}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
            >
              <CheckCircle className="h-4 w-4 text-green-600" /> {r.title}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-xl bg-blue-600 p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Spend a free credit on a real keyword</h2>
        <p className="mt-2 text-blue-100">10 free articles. No card. Paid credits never expire.</p>
        <Link
          href="/register"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 font-medium text-blue-700 hover:bg-blue-50"
        >
          Create free account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
