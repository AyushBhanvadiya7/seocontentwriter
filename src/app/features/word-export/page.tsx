import Link from "next/link";
import { ArrowRight, CheckCircle, FileDown, FileText, Code2, Copy } from "lucide-react";

// Public SEO landing page: Word, HTML and Markdown export.
export const metadata = {
  title: "Export Articles to Word, HTML or Markdown",
  description:
    "Download a finished article as Word for a client, HTML for your CMS, or Markdown for a developer. One click from the article page.",
  alternates: { canonical: "/features/word-export" },
};

const INCLUDED = [
  {
    icon: FileDown,
    title: "Word for clients",
    text: "A clean .docx you can email. Headings and paragraphs stay intact. No messy paste from a chat box.",
  },
  {
    icon: Code2,
    title: "HTML for your CMS",
    text: "Copy HTML when the site wants markup. You still publish it yourself. We do not log into WordPress.",
  },
  {
    icon: FileText,
    title: "Markdown for developers",
    text: "A plain .md file for docs, Git, or any editor that speaks Markdown.",
  },
  {
    icon: Copy,
    title: "Copy without downloading",
    text: "Need one section in an email? Copy from the article page. Download when you want the whole file.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Open the finished article",
    text: "Export lives on the article, next to the draft. Not in a separate tool.",
  },
  {
    n: "2",
    title: "Pick the format",
    text: "Word, HTML or Markdown. Each button makes that file from the saved article.",
  },
  {
    n: "3",
    title: "Hand it to whoever publishes",
    text: "Send the Word file to a client, or paste HTML into your CMS. The meta title stays on the article page to copy too.",
  },
];

const FAQS = [
  {
    q: "Does export publish the article for me?",
    a: "No. Export gives you a file. You upload or paste it into your own site. We never ask for your CMS password.",
  },
  {
    q: "Is the Word file a real .docx?",
    a: "Yes. It opens in Word, Google Docs and LibreOffice. It is not a renamed text file.",
  },
  {
    q: "Do images come inside the Word file?",
    a: "The article includes image prompts and alt text. Photo files are not embedded. Add your own images when you publish.",
  },
  {
    q: "Can I export again after I edit?",
    a: "Yes. Save the article first. The next download uses the saved version, not the old draft.",
  },
];

const RELATED = [
  { slug: "meta-schema", title: "Meta tags + schema" },
  { slug: "internal-linking", title: "Internal + external links" },
  { slug: "ai-article-generator", title: "AI article generator" },
  { slug: "keyword-research", title: "Keyword research" },
];

export default function WordExportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Word export</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Word, HTML or Markdown — one click from the article
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Clients want a Word file. Your site wants HTML. A developer wants Markdown.
        The same article downloads in the format you need.
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
        <h2 className="text-2xl font-semibold">Send a Word file, not a screenshot</h2>
        <p className="mt-2 text-blue-100">10 free articles. Download any of them.</p>
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
