import Link from "next/link";
import { ArrowRight, Ban, CheckCircle, PenLine, UserRound } from "lucide-react";

// Public SEO landing page: brand voice.
// This is the marketing page, not the logged-in project voice form.
export const metadata = {
  title: "Brand Voice for Every New Article",
  description:
    "Set tone, author, banned words and a sample paragraph once per project. New articles follow that voice. Same 1 credit.",
  alternates: { canonical: "/features/brand-voice" },
};

const INCLUDED = [
  {
    icon: PenLine,
    title: "A sample of your writing",
    text: "Paste a few lines you actually wrote. New drafts use that rhythm, not a generic blog voice.",
  },
  {
    icon: Ban,
    title: "Words that never appear",
    text: "Ban leverage, delve, or whatever you hate. The writer is told to leave them out.",
  },
  {
    icon: UserRound,
    title: "A named author",
    text: "Author name, bio and credentials can sit on the article, so it does not read like an unsigned bot.",
  },
  {
    icon: CheckCircle,
    title: "AI or humanized, same credit",
    text: "Pick standard AI or a humanized pass when you generate. Both cost 1 credit. The voice rules apply either way.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Open Brand voice on the project",
    text: "Tone, reading level, author, sample paragraph, must-use words and banned words. Save once.",
  },
  {
    n: "2",
    title: "Generate as usual",
    text: "Pick a keyword and choose AI or Humanized. The saved voice is already in the request.",
  },
  {
    n: "3",
    title: "Edit if a line still sounds off",
    text: "The article page is a normal editor. Change a sentence, save, and export the fixed version.",
  },
];

const FAQS = [
  {
    q: "Is this a promise of 0% on an AI detector?",
    a: "No. Detectors disagree with each other. Humanized mode aims for plainer, more human wording. You should still read the draft.",
  },
  {
    q: "Do I set voice once, or every article?",
    a: "Once per project. Change it later and the next article uses the new settings. Old articles stay as they were.",
  },
  {
    q: "Does humanized cost extra credits?",
    a: "No. AI and Humanized are both 1 credit per article.",
  },
  {
    q: "Can different websites sound different?",
    a: "Yes. Each project has its own brand voice. A safari site and a clinic do not share one voice.",
  },
];

const RELATED = [
  { slug: "ai-article-generator", title: "AI article generator" },
  { slug: "keyword-research", title: "Keyword research" },
  { slug: "word-export", title: "Word, HTML, Markdown" },
  { slug: "meta-schema", title: "Meta tags + schema" },
];

export default function BrandVoiceFeaturePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Brand voice</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Your voice, saved once, used on every new article
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Tone, banned words and a paragraph you wrote. The next article starts from that,
        not from a blank corporate template.
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
        <h2 className="text-2xl font-semibold">Sound like your site, not like a template</h2>
        <p className="mt-2 text-blue-100">Set the voice once. 10 free articles to try it.</p>
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
