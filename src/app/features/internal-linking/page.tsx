import Link from "next/link";
import { ArrowRight, CheckCircle, Link2, ListTree, Map, Search } from "lucide-react";

// Public SEO landing page: internal and external links.
export const metadata = {
  title: "Internal Links From Your Real Pages",
  description:
    "Import a sitemap or paste page URLs. New articles link to your own pages where the words appear, and cite real ranking URLs.",
  alternates: { canonical: "/features/internal-linking" },
};

const INCLUDED = [
  {
    icon: Map,
    title: "Sitemap import",
    text: "Point at your sitemap.xml and pull the pages you already published. No copy-paste of fifty URLs.",
  },
  {
    icon: ListTree,
    title: "A page library",
    text: "Paste URLs one per line if you prefer. Duplicates are skipped. Remove a page any time.",
  },
  {
    icon: Link2,
    title: "Links where the words appear",
    text: "New articles mention your pages only when the wording fits. Not a dump of links at the bottom.",
  },
  {
    icon: Search,
    title: "Real external sources",
    text: "Competitor and reference links come from pages that actually rank for the keyword, not invented URLs.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Add your pages once",
    text: "Open the project's Links page. Import the sitemap, or paste the URLs you want articles to use.",
  },
  {
    n: "2",
    title: "Write from a keyword",
    text: "The article is researched against live Google results, so external links have a real source.",
  },
  {
    n: "3",
    title: "Review the links in the draft",
    text: "Open the article and check which of your pages were used. Edit the sentence if you want a different target.",
  },
];

const FAQS = [
  {
    q: "Will every article link to every page?",
    a: "No. A link is added only where the words match a page in your library. Empty library means no internal links yet.",
  },
  {
    q: "Do I have to use a sitemap?",
    a: "No. Paste URLs if that is easier. Sitemap is just the fast way to add a whole site.",
  },
  {
    q: "Are the external links made up?",
    a: "No. They come from pages found in live search results for that keyword. You can still edit or remove them.",
  },
  {
    q: "Does this log into my website?",
    a: "No. We only read the public sitemap or the URLs you paste. Publishing stays in your hands.",
  },
];

const RELATED = [
  { slug: "keyword-research", title: "Keyword research" },
  { slug: "meta-schema", title: "Meta tags + schema" },
  { slug: "brand-voice", title: "Your voice, not a robot's" },
  { slug: "word-export", title: "Word, HTML, Markdown" },
];

export default function InternalLinkingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/features" className="hover:text-blue-600">Features</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Internal linking</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Internal links from the pages you already have
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Add your site once. Later articles link to those pages where the words fit,
        and point outside only to URLs that showed up in real search results.
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
        <h2 className="text-2xl font-semibold">Link the pages you already published</h2>
        <p className="mt-2 text-blue-100">Import a sitemap once. Every new article can use it.</p>
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
