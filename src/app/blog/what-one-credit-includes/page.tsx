import Link from "next/link";

// Public article. Guest-safe only after middleware allows /blog.
export const metadata = {
  title: "What 1 Credit Includes, and Why Rankings Are Not Promised",
  description:
    "One credit writes one researched article with meta tags, schema, links and export. It does not publish the page, and it does not promise a Google ranking.",
  alternates: { canonical: "/blog/what-one-credit-includes" },
};

export default function WhatOneCreditIncludesPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-blue-600">Blog</Link>
      </nav>

      <p className="mt-6 text-sm text-slate-500">1 October 2026 · SEO Content Writer</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
        What 1 credit includes, and why a ranking is not part of the deal
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        A credit is not a subscription month, and it is not a promise that Google will rank the page.
        It pays for one researched draft and the SEO extras that sit with it. You still read it,
        edit it, and publish it yourself.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">What the credit buys</h2>
      <p className="mt-3 text-slate-700">
        One credit makes one article. AI mode and Humanized mode cost the same. Humanized aims for
        plainer wording. It is not a promise of 0% on an AI detector. Detectors disagree with each other.
      </p>
      <p className="mt-3 text-slate-700">
        The finished draft includes a meta title, a meta description, an FAQ with schema, internal and
        external links, image prompts with alt text, and a quality score. You can download Word, HTML
        or Markdown from the article page. The generate box estimates about 2 to 3 minutes. That is an
        estimate, not a timer we guarantee.
      </p>
      <p className="mt-3 text-slate-700">
        If you write the article yourself, that Human path does not spend a credit. The site only scores
        what you typed. Credits are for generated articles.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">What the credit does not buy</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>It does not log into WordPress, Shopify, or any other site.</li>
        <li>It does not upload the article for you. Export gives you a file. You paste or upload it.</li>
        <li>It does not buy backlinks, ads, or a place on page one.</li>
        <li>It does not expire if you paid for it. Paid credits stay until you use them.</li>
      </ul>
      <p className="mt-3 text-slate-700">
        New accounts start with 10 free credits. That is 10 generated articles, not 10 rankings.
        If generation fails on our side, the credit comes back on its own. An unused pack can be
        refunded within 7 days. The details are on the{" "}
        <Link href="/refunds" className="font-medium text-blue-600 hover:text-blue-700">refund policy</Link>.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Why we will not promise a ranking</h2>
      <p className="mt-3 text-slate-700">
        Google ranks a URL, not a file sitting in your downloads folder. The page still needs to be
        published on a real site. After that, rankings depend on the query, the pages already in the
        results, the history of your site, and links from other sites. No writing tool controls those.
      </p>
      <p className="mt-3 text-slate-700">
        What we can do is start from live Google results instead of a guessed outline: top pages,
        People Also Ask, and related searches. The draft can match the shape of a useful article.
        That is a better starting point. It is not a rank guarantee, and anyone who sells one is
        guessing.
      </p>
      <p className="mt-3 text-slate-700">
        You should still edit. A sentence that is true for a general reader may be wrong for your
        city, your price, or your product. The editor is there so the published page is yours.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">A fair way to judge the first article</h2>
      <p className="mt-3 text-slate-700">
        Spend one free credit on a keyword you actually care about. Read the draft. Check the meta
        title, the FAQ, and one internal link. If a line is wrong, change it and save. Then export.
        Judge the tool on that file, not on a ranking you cannot see yet.
      </p>
      <p className="mt-3 text-slate-700">
        More on the generator itself is on the{" "}
        <Link href="/features/ai-article-generator" className="font-medium text-blue-600 hover:text-blue-700">
          credits page
        </Link>
        . Pack prices are on{" "}
        <Link href="/pricing" className="font-medium text-blue-600 hover:text-blue-700">pricing</Link>.
      </p>

      <div className="mt-12 rounded-xl bg-blue-600 p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Use one free credit on a real keyword</h2>
        <p className="mt-2 text-blue-100">10 free articles. No card. No ranking promise.</p>
        <Link
          href="/register"
          className="mt-5 inline-flex items-center rounded-lg bg-white px-6 py-2.5 font-medium text-blue-700 hover:bg-blue-50"
        >
          Create free account
        </Link>
      </div>
    </article>
  );
}
