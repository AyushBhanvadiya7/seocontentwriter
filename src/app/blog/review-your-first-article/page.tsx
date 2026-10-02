import Link from "next/link";
import Image from "next/image";

import { absoluteUrl } from "@/lib/site-url";

// Public review guide. Distinct from the credit explainer. Do not merge them.
const PATH = "/blog/review-your-first-article";
const TITLE = "How to Review the Article One Credit Just Wrote";
const DESCRIPTION =
  "Check the facts, meta tags and links in the draft one credit produced. Then publish it yourself. A credit is not a Google ranking.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: PATH,
    images: [
      {
        url: "/blog/review-your-first-article/editor-reading-draft.jpg",
        width: 1280,
        height: 720,
        alt: "Editor reading a printed draft beside a laptop before publishing",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",
  author: { "@type": "Organization", name: "SEO Content Writer" },
  publisher: { "@type": "Organization", name: "SEO Content Writer" },
  image: [absoluteUrl("/blog/review-your-first-article/editor-reading-draft.jpg")],
  mainEntityOfPage: absoluteUrl(PATH),
};

export default function ReviewYourFirstArticlePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-blue-600">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Review the draft</span>
      </nav>

      <p className="mt-6 text-sm text-slate-500">1 October 2026 · Written by the SEO Content Writer team</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
        Read the draft before you turn it into a public page
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        One credit has already paid for a researched draft, meta tags, an FAQ, links and a quality score.
        This page is the review you do next. It is not a second explanation of the credit, and it is not
        a promise that the page will rank.
      </p>

      <figure className="mt-8">
        <Image
          src="/blog/review-your-first-article/editor-reading-draft.jpg"
          alt="Editor reading a printed draft beside a laptop before publishing"
          width={1280}
          height={720}
          className="aspect-video w-full rounded-xl object-cover"
        />
        <figcaption className="mt-2 text-sm text-slate-500">
          Read the draft slowly. The first version is a starting point, not the page you publish.
        </figcaption>
      </figure>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">What the credit already finished</h2>
      <p className="mt-3 text-slate-700">
        If you still need the list of what 1 credit includes, and why a ranking is not part of that
        purchase, read{" "}
        <Link href="/blog/what-one-credit-includes" className="font-medium text-blue-600 hover:text-blue-700">
          that note
        </Link>{" "}
        first. This page assumes the draft exists and you are about to decide whether it is fit to publish.
      </p>
      <p className="mt-3 text-slate-700">
        This guide was written by the people who run the product. The article tool did not write it.
        Google asks sites to be clear about how a page was made, and to add something a raw draft does
        not have: a human check.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Check the facts only you know</h2>
      <p className="mt-3 text-slate-700">
        The research can see public pages. It cannot see your price list, your city, or the job you
        refuse to take. Read every number. If the draft says a repair costs 500 rupees and you charge
        1800, change the sentence and save. A true article for a general reader can still be a false
        article for your business.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>Names of products, areas and people.</li>
        <li>Prices, timings and any claim that sounds like a guarantee.</li>
        <li>Advice on health, money or law. If you are not the expert, cut the line or name a real source.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Check the extras that came with the draft</h2>
      <p className="mt-3 text-slate-700">
        The quality score is a checklist inside the product. It is not a rank from Google. It looks for
        one H1, at least four H2 sections, the word target, a keyword density between 0.4% and 2%, short
        sentences, a meta title of 30 to 65 characters, and a meta description of 120 to 165 characters.
      </p>
      <p className="mt-3 text-slate-700">
        Open the internal link. It should point at a real page on your site, on words that are actually
        in the draft. Open the external link too. It should be a page that ranked for the topic, not a
        dead URL. If a link is wrong, delete it. A missing link is better than a fake one.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Three things the draft cannot prove</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>That Google will rank the URL. The file is not even on your site yet.</li>
        <li>That an AI detector will score it at zero. Detectors disagree with each other.</li>
        <li>That you can skip the edit because the score looks high.</li>
      </ul>
      <p className="mt-3 text-slate-700">
        Google does not ban a page because a tool helped with the draft. Google does treat a pile of
        near-copy pages, made with little effort and no added value, as spam. That is called scaled
        content abuse. One reviewed article is fine. Ten untouched copies of the same keyword are not.
        The official note is on{" "}
        <a
          href="https://developers.google.com/search/docs/fundamentals/using-gen-ai-content"
          className="font-medium text-blue-600 hover:text-blue-700"
          rel="noreferrer"
          target="_blank"
        >
          Google Search Central
        </a>
        .
      </p>

      <figure className="mt-8">
        <Image
          src="/blog/review-your-first-article/publish-the-file-yourself.jpg"
          alt="Person holding a printed article beside a website layout on a monitor"
          width={1280}
          height={720}
          loading="lazy"
          className="aspect-video w-full rounded-xl object-cover"
        />
        <figcaption className="mt-2 text-sm text-slate-500">
          The file can be ready while the website is still empty. You publish it. The tool does not log in for you.
        </figcaption>
      </figure>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Publish only the version you edited</h2>
      <p className="mt-3 text-slate-700">
        Save the article first. Then download Word, HTML or Markdown. Paste or upload that file into
        your own site. Export does not know your CMS password, and it should not. After the page is
        live, rankings still depend on the query, the pages already in the results, your site history
        and links from other sites.
      </p>
      <p className="mt-3 text-slate-700">
        If generation failed, there is no draft to review. The credit comes back on its own. Details are
        on the{" "}
        <Link href="/refunds" className="font-medium text-blue-600 hover:text-blue-700">refund policy</Link>.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">A fair way to pass or fail the credit</h2>
      <p className="mt-3 text-slate-700">
        Pass: the facts match your business, the weak lines are rewritten, and the links open. Fail:
        the prices are wrong, the links are dead, or you were about to publish the raw draft because
        the score looked tidy. Spend the next credit on a different keyword, or on a real new angle.
        Do not spend it on a copy of the page you just published.
      </p>
      <p className="mt-3 text-slate-700">
        The generator, the credit rule and the export buttons are explained on the{" "}
        <Link href="/features/ai-article-generator" className="font-medium text-blue-600 hover:text-blue-700">
          credits page
        </Link>{" "}
        and the{" "}
        <Link href="/features/word-export" className="font-medium text-blue-600 hover:text-blue-700">
          export page
        </Link>
        . Pack prices are on{" "}
        <Link href="/pricing" className="font-medium text-blue-600 hover:text-blue-700">pricing</Link>.
      </p>

      <div className="mt-12 rounded-xl bg-blue-600 p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Use one free credit, then review it</h2>
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
