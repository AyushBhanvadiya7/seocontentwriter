import Link from "next/link";
import { ArrowRight, Coins, FileDown, Globe, Link2, Pencil, Tags } from "lucide-react";

// Public index for the six feature pages. Guest-safe because /features is public.
export const metadata = {
  title: "Six Features Behind Every SEO Article",
  description:
    "Open the six parts of an article: research, meta and schema, links, Word export, brand voice, and credits that never expire.",
  alternates: { canonical: "/features" },
};

const FEATURES = [
  {
    href: "/features/keyword-research",
    icon: Globe,
    title: "Real Google research",
    text: "Upload a keyword file. Each article starts from live results, People Also Ask and related searches.",
  },
  {
    href: "/features/meta-schema",
    icon: Tags,
    title: "Meta tags + schema",
    text: "SEO title, meta description, FAQ schema and article markup are written with the draft.",
  },
  {
    href: "/features/internal-linking",
    icon: Link2,
    title: "Internal + external links",
    text: "Your own pages are linked where the words appear. Competitor links come from real ranking URLs.",
  },
  {
    href: "/features/word-export",
    icon: FileDown,
    title: "Word, HTML, Markdown",
    text: "Download a .docx for a client, HTML for your CMS, or Markdown for a developer. You still publish it.",
  },
  {
    href: "/features/brand-voice",
    icon: Pencil,
    title: "Your voice, not a robot's",
    text: "Tone, banned words and a sample paragraph are saved once per project. The next article uses them.",
  },
  {
    href: "/features/ai-article-generator",
    icon: Coins,
    title: "Credits never expire",
    text: "1 credit makes 1 article, AI or humanized. Paid credits stay until you use them. No monthly reset.",
  },
];

export default function FeaturesIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Features</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Six parts. One article. You still edit before you publish.
      </h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-600">
        These pages explain what the product does. Writing the article happens after you log in,
        inside a project. Nothing here publishes to your website.
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

      <h2 className="mt-12 text-2xl font-semibold text-slate-900">What is included</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"
          >
            <item.icon className="h-6 w-6 text-blue-600" />
            <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-blue-700">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
              Read more <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-blue-600 p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Try one keyword before you buy a pack</h2>
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
