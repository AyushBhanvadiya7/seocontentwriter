import Link from "next/link";
import { ArrowRight, CheckCircle, FileJson, ListChecks, Search, Tags } from "lucide-react";

// Public SEO landing page: meta tags and schema.
export const metadata = {
  title: "Meta Tags and Schema, Written With the Article",
  description:
    "Every article gets an SEO title, meta description, FAQ schema and article markup. Checked before you publish, not pasted in later.",
  alternates: { canonical: "/features/meta-schema" },
};

const INCLUDED = [
  {
    icon: Tags,
    title: "SEO title and description",
    text: "A title and meta description written for the keyword, short enough for Google and clear enough for a human.",
  },
  {
    icon: ListChecks,
    title: "FAQ schema",
    text: "Real questions from the topic become an FAQ block, with schema so search engines can read the answers.",
  },
  {
    icon: FileJson,
    title: "Article markup",
    text: "Headline, author and publish-ready structure travel with the article, not as a separate chore.",
  },
  {
    icon: Search,
    title: "Checked before you ship",
    text: "Missing title, thin description or a broken heading shows up on the article page before you export.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Pick a keyword",
    text: "The same keyword that drives the article also drives the title, description and FAQ.",
  },
  {
    n: "2",
    title: "Review the SEO panel",
    text: "Open the finished article. Title, description and schema sit next to the draft, ready to edit.",
  },
  {
    n: "3",
    title: "Export with the tags included",
    text: "Word, HTML or Markdown keeps the article. Copy the meta fields into your CMS when you publish.",
  },
];

const FAQS = [
  {
    q: "Do I still paste the title into my website?",
    a: "Yes. We write and check the tags. You copy them into WordPress, Shopify or whatever CMS you use. We do not log into your site.",
  },
  {
    q: "What schema is included?",
    a: "FAQ schema from the article's questions, plus article markup for the headline and author. It is generated with the draft, not added by hand.",
  },
  {
    q: "Can I change the meta title?",
    a: "Yes. The article page lets you edit the title, meta description and body, then save. The counts update when you save.",
  },
  {
    q: "Does this guarantee a rich result on Google?",
    a: "No. Google decides what to show. What you get is valid, complete markup so you are not publishing a bare article.",
  },
];

const RELATED = [
  { slug: "keyword-research", title: "Keyword research" },
  { slug: "internal-linking", title: "Internal + external links" },
  { slug: "word-export", title: "Word, HTML, Markdown" },
  { slug: "ai-article-generator", title: "AI article generator" },
];

export default function MetaSchemaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Meta tags + schema</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Meta tags and schema, written with the article
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        The draft is not done until the title, description and FAQ schema are done too.
        One credit covers the article and the tags.
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
        {INCLUDED.map((f) => (
          <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <f.icon className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.text}</p>
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
        <h2 className="text-2xl font-semibold">Publish with the tags already written</h2>
        <p className="mt-2 text-blue-100">10 free articles. No card needed to start.</p>
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
