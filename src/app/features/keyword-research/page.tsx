import Link from "next/link";
import { ArrowRight, CheckCircle, FileUp, Layers, Search, Target } from "lucide-react";

// Public SEO landing page: keyword research feature.
// Server component — metadata lives here, nav/footer come from root layout.
export const metadata = {
  title: "Keyword Research to SEO Article, Automatically",
  description:
    "Upload CSV, Excel or PDF keyword files. We clean, dedupe and cluster them by intent, then turn every keyword into a researched, publish-ready article.",
  alternates: { canonical: "/features/keyword-research" },
};

const INCLUDED = [
  {
    icon: FileUp,
    title: "Any file format",
    text: "CSV, Excel, PDF, DOCX, TXT or JSON. Drop the file, we extract and clean every keyword.",
  },
  {
    icon: Layers,
    title: "Auto clustering",
    text: "Keywords group themselves by search intent — pillar topics and supporting posts sort out on their own.",
  },
  {
    icon: Search,
    title: "Real Google data",
    text: "Top-ranking pages, People Also Ask and related searches pulled live for every keyword.",
  },
  {
    icon: Target,
    title: "One click to article",
    text: "Pick any keyword and the brief is pre-filled — content type, audience, word count and tone ready.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Upload your keyword file",
    text: "Export from any keyword tool — or even a rough list. Duplicates and junk rows are removed automatically.",
  },
  {
    n: "2",
    title: "Review clusters",
    text: "See which keywords belong together, what each group means, and which one deserves a pillar article.",
  },
  {
    n: "3",
    title: "Generate the article",
    text: "Click a keyword. Research, outline, writing, links and validation run as one guided flow.",
  },
];

const FAQS = [
  {
    q: "Which keyword file formats are supported?",
    a: "CSV, Excel (XLSX), PDF, DOCX, TXT and JSON. If a tool can export it, we can almost certainly read it.",
  },
  {
    q: "Do I need another keyword tool first?",
    a: "Any list works — from Google Keyword Planner, Search Console exports, or even keywords you typed yourself. We handle cleaning and clustering.",
  },
  {
    q: "How is clustering done?",
    a: "Keywords are grouped by search intent, so one cluster equals one article idea. Pillar topics naturally stand out from supporting posts.",
  },
  {
    q: "Can I edit keywords after upload?",
    a: "Yes. Add, rename, delete or move keywords between clusters any time before you generate the article.",
  },
];

const RELATED = [
  { slug: "meta-schema", title: "Meta tags + schema" },
  { slug: "internal-linking", title: "Internal + external links" },
  { slug: "word-export", title: "Word, HTML, Markdown" },
  { slug: "brand-voice", title: "Your voice, not a robot's" },
  { slug: "ai-article-generator", title: "AI article generator" },
];

export default function KeywordResearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">
          Features
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Keyword Research</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Keyword research that turns itself into articles
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Stop copying keywords between five tools. Upload one file — get cleaned clusters, live
        Google research and a publish-ready article for every keyword, in minutes.
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
        <h2 className="text-2xl font-semibold">Your first 10 articles are free</h2>
        <p className="mt-2 text-blue-100">Upload keywords today, publish your first article today.</p>
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
