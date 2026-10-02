import Link from "next/link";
import {
  ArrowRight,
  CheckCircle,
  FileText,
  Search,
  Sparkles,
  Globe,
  Tags,
  Link2,
  FileDown,
  Pencil,
  Coins,
  Users,
  PenLine,
  Building2,
  BadgeCheck,
} from "lucide-react";
import {
  Accordion,
  Counter,
  Magnetic,
  MouseGlow,
  Parallax,
  Reveal,
  ScrollProgress,
  TiltCard,
} from "@/components/landing";

export const metadata = {
  title: "Research, write, publish",
  description:
    "Turn keywords into researched, publish-ready SEO articles with meta tags, schema, internal links and Word export — in under 3 minutes. Start free with 10 credits.",
  alternates: {
    canonical: "/",
  },
};

const FEATURES = [
  {
    icon: Globe,
    slug: "keyword-research",
    title: "Real Google research",
    text: "Every article starts from live Google results — top pages, People Also Ask and related searches. No guessed competitors.",
  },
  {
    icon: Tags,
    slug: "meta-schema",
    title: "Meta tags + schema",
    text: "SEO title, meta description, FAQ schema and article markup are written and validated automatically.",
  },
  {
    icon: Link2,
    slug: "internal-linking",
    title: "Internal + external links",
    text: "Your pages get linked where the words actually appear. Competitor references come from real ranking URLs.",
  },
  {
    icon: FileDown,
    slug: "word-export",
    title: "Word, HTML, Markdown",
    text: "Download clean .docx for clients, HTML for your CMS, or Markdown for developers. One click each.",
  },
  {
    icon: Pencil,
    slug: "brand-voice",
    title: "Your voice, not a robot's",
    text: "Brand voice, banned words and your own sample paragraph shape every draft. AI writes, you sound like you.",
  },
  {
    icon: Coins,
    slug: "ai-article-generator",
    title: "Credits never expire",
    text: "1 credit makes 1 article. Paid credits stay valid forever — no monthly pressure, no waste.",
  },
];

const FAQS = [
  {
    q: "Is it really free to start?",
    a: "Yes. Every new account gets 10 free credits — that is 10 full articles. No credit card needed. You only pay when you want more.",
  },
  {
    q: "Will my article rank on Google?",
    a: "No honest tool can promise rankings — they depend on your site, competition and links too. What we promise is genuinely researched, well-structured content that gives you the best possible starting point.",
  },
  {
    q: "What do I get with each article?",
    a: "A complete article plus meta title, meta description, FAQ section with schema, internal and external links, image prompts with alt text, a quality score, and Word/HTML/Markdown downloads.",
  },
  {
    q: "Do credits expire?",
    a: "Never. Paid credits stay in your account until you use them — whether that takes a week or a year.",
  },
  {
    q: "How do payments work?",
    a: "Secure UPI, cards and netbanking through Razorpay. Prices in Indian Rupees. Unused packs can be refunded within 7 days — see our Refund Policy.",
  },
  {
    q: "Can I edit the article?",
    a: "Absolutely — you should. Every article opens in an editor with live counts, and the preview, HTML and word count update the moment you save.",
  },
];

const MARQUEE_ITEMS = [
  "Keyword Research",
  "Detailed Outline",
  "Human-style Writing",
  "Meta Tags + Schema",
  "Internal + External Links",
  "FAQ Section",
  "Image Prompts",
  "Word Export",
];

const STATS = [
  { value: 10, label: "free articles on signup" },
  { value: 6, label: "keyword file formats" },
  { value: 8, label: "things in every article" },
  { value: 3, label: "steps to publish" },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      <ScrollProgress />

      {/* DARK HERO */}
      <MouseGlow className="bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2">
            <Parallax speed={0.18}>
              <div className="h-72 w-[36rem] rounded-full bg-blue-600/25 blur-3xl" />
            </Parallax>
          </div>
          <div className="absolute right-[8%] top-40">
            <Parallax speed={0.3}>
              <div className="h-56 w-56 animate-pulse rounded-full bg-cyan-500/15 blur-3xl" />
            </Parallax>
          </div>
          <div className="absolute left-[6%] top-64">
            <Parallax speed={0.08}>
              <div className="h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl" />
            </Parallax>
          </div>
        </div>
        <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 text-center md:pt-24">
           <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-center text-sm font-medium text-blue-300">
            <Sparkles className="h-4 w-4" /> Simple English. Real research. Publish-ready.
          </div>
           <h1 className="mx-auto mt-6 max-w-3xl px-1 text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-6xl">
            <span className="block sm:inline">SEO content that </span>
            <span className="inline-block animate-shimmer bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-400 bg-clip-text text-transparent">
              ranks
            </span>{" "}
            <span className="mt-1 block sm:mt-0 sm:inline">— without the jargon</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Upload your keywords once. Pick a topic. Get a researched, human-sounding article with
            internal links, meta tags, schema, and image prompts in under 3 minutes.
          </p>
           <div className="mx-auto mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
            <Magnetic className="w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 sm:w-auto"
              >
                Start using it free <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900 px-6 py-3 text-base font-medium text-slate-200 hover:bg-slate-800 sm:w-auto"
            >
              View pricing
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-green-400" /> 10 free credits
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-green-400" /> No card needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-green-400" /> Real Google research
            </span>
          </div>

          {/* Product mockup (floats, tilts, parallaxes — try it!) */}
          <Parallax speed={0.05} className="mx-auto mt-12 max-w-3xl">
            <div className="animate-float-slow">
              <TiltCard>
                <div className="rounded-2xl border border-slate-700 bg-slate-900 text-left shadow-2xl shadow-blue-900/40">
                  <div className="flex items-center gap-1.5 border-b border-slate-700/60 px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-3 hidden rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-300 sm:inline">
                      your-article — Score 92/100
                    </span>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-[1fr_180px]">
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-3/4 rounded bg-slate-100" />
                      <div className="h-3 w-full rounded bg-slate-700" />
                      <div className="h-3 w-full rounded bg-slate-700" />
                      <div className="h-3 w-5/6 rounded bg-slate-700" />
                      <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
                        Frequently asked questions
                      </div>
                      <div className="h-3 w-2/3 rounded bg-blue-900" />
                      <div className="h-3 w-1/2 rounded bg-blue-900" />
                      <div className="flex gap-2 pt-1">
                        <span className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white">.docx</span>
                        <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300">.html</span>
                        <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300">.md</span>
                      </div>
                    </div>
                    <div className="space-y-3 border-t border-slate-700/60 bg-slate-900/60 p-5 text-xs sm:border-l sm:border-t-0">
                      <p className="font-semibold uppercase tracking-wide text-slate-400">SEO panel</p>
                      <div>
                        <p className="text-slate-400">Meta title</p>
                        <div className="mt-1 h-2.5 w-full rounded bg-green-400" />
                      </div>
                      <div>
                        <p className="text-slate-400">Readability</p>
                        <p className="mt-0.5 font-semibold text-white">Flesch 68</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Links</p>
                        <p className="mt-0.5 font-semibold text-white">4 internal · 3 external</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>
          </Parallax>
        </section>
      </MouseGlow>

      {/* WAVE DIVIDER (dark melts into white) */}
      <div aria-hidden className="-mt-1 bg-slate-950">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="block h-12 w-full md:h-20">
          <path
            d="M0,48 C240,88 480,8 720,44 C960,80 1200,16 1440,52 L1440,80 L0,80 Z"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* MARQUEE BAND */}
      <div className="overflow-hidden border-y border-blue-700 bg-blue-600 py-3">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center pr-10 text-sm font-semibold text-white">
              {item} <span className="pl-10 text-blue-200">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* FILE STRIP */}
      <section className="border-b border-slate-100 bg-white px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 text-sm">
          <span className="mr-2 font-medium text-slate-500">Drop any keyword file:</span>
          {["CSV", "Excel", "PDF", "DOCX", "TXT", "JSON"].map((f) => (
            <span
              key={f}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* STATS BAND */}
      <section className="border-b border-blue-100 bg-blue-50/60 px-4 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <p className="text-4xl font-bold text-blue-700 md:text-5xl">
                <Counter value={s.value} />
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>
   {/* SAMPLE DEMO */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">See what you get</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
          A real sample: keyword in, full researched article out — meta tags, FAQ and export included.
        </p>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Keyword: terrace leak repair
          </p>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Terrace Leak Repair: 7 Fixes That Actually Last</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            A leaking terrace is not just a stain on the ceiling — it weakens the slab a little more
            every monsoon. The good news: most residential leaks come from just three places —
            cracked screed joints, failed waterproof coating near drains, and parapet-wall gaps.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            In this guide we compare 7 repair methods by cost, life and best-use case, so you can
            pick the right fix instead of repainting the same patch every year...
          </p>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-800">Meta title:</span> Terrace Leak Repair Cost and 7 Proven Fixes (2026 Guide)</p>
            <p className="mt-1"><span className="font-semibold text-slate-800">Meta description:</span> Stop terrace leaks for good. Compare 7 repair methods, real costs in India, and when to call a contractor.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["1,240 words", "FAQ included", "Schema ready", "Word export"].map((c) => (
              <span key={c} className="rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">{c}</span>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create yours free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      {/* FEATURES */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold text-slate-900">Everything a post needs</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            Not just words — the full package Google and your readers expect.
          </p>
        </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100}>
              <Link
                href={`/features/${f.slug}`}
                className="shine group block h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DARK PACKAGE BAND */}
      <MouseGlow className="bg-slate-950">
        <section className="relative mx-auto max-w-5xl px-4 py-16">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-white">Every article ships with</h2>
          </Reveal>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {[
              "Full article in simple English",
              "Meta title + meta description",
              "FAQ section with schema",
              "Internal + external links",
              "Image prompts with alt text",
              "Readability + quality score",
              "Word, HTML, Markdown export",
              "Built-in editor",
            ].map((item, i) => (
              <Reveal key={item} delay={(i % 2) * 80}>
                <p className="flex items-center gap-2 text-sm text-slate-200">
                  <CheckCircle className="h-4 w-4 shrink-0 text-green-400" /> {item}
                </p>
              </Reveal>
            ))}
          </div>
        </section>
      </MouseGlow>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold text-slate-900">How it works</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "1. Upload your keyword file",
              text: "CSV, Excel, PDF, DOCX, TXT or JSON. We clean, de-duplicate and cluster them automatically.",
            },
            {
              icon: Search,
              title: "2. Pick a keyword",
              text: "Click any keyword. The form is pre-filled with content type, audience and word count.",
            },
            {
              icon: Sparkles,
              title: "3. Get publish-ready content",
              text: "Research, outline, writing, links, validation and exports — all in one place.",
            },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="shine h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="border-t border-slate-100 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold text-slate-900">Built for people who publish</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Users, title: "SEO freelancers", text: "Deliver client-ready drafts with meta and schema in minutes, not days." },
              { icon: PenLine, title: "Bloggers", text: "Turn one keyword list into months of researched, consistent posts." },
              { icon: Building2, title: "Agencies", text: "300-credit packs, clean Word exports and a billing trail for every article." },
            ].map((a, i) => (
              <Reveal key={a.title} delay={i * 100}>
                <div className="shine h-full rounded-2xl bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{a.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Reveal>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Simple pricing, credits that never expire</h2>
            <p className="mt-2 text-sm text-slate-600">1 credit = 1 article. Start with 10 free.</p>
          </div>
        </Reveal>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { name: "Starter", price: "499", credits: "25 credits" },
            { name: "Pro", price: "1,499", credits: "100 credits" },
            { name: "Agency", price: "3,999", credits: "300 credits" },
          ].map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div className="shine h-full rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  <span className="text-base">Rs.</span> {p.price}
                </p>
                <p className="text-sm text-slate-600">{p.credits}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Compare all plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold text-slate-900">Common questions</h2>
        </Reveal>
        <div className="mt-8">
          <Accordion items={FAQS} />
        </div>
      </section>

      {/* DARK FINAL CTA */}
      <MouseGlow className="mx-auto max-w-5xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-slate-950 px-6 py-12 text-center shadow-2xl">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl" />
            </div>
            <h2 className="relative mx-auto max-w-2xl text-2xl font-semibold text-white md:text-3xl">
              Your first 10 articles are free. No card needed.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-slate-300">
              Create an account, upload keywords, and publish your first researched article today.
            </p>
              <Magnetic className="relative mt-6 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 sm:w-auto"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </MouseGlow>
    </div>
  );
}