import Link from "next/link";
import { BUSINESS } from "@/lib/business";

// Public about page. Facts only. No invented team size, years, or rankings.
export const metadata = {
  title: "About SEO Content Writer",
  description:
    "A small product from Ahmedabad. One credit writes one researched article. We do not promise a Google ranking, and we do not publish the page for you.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">About</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        A writing tool from Ahmedabad, not a ranking promise
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        SEO Content Writer turns a keyword into a researched draft. You still read it, edit it,
        and publish it on your own site.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">Who runs it</h2>
      <p className="mt-3 text-slate-700">
        This service is operated by {BUSINESS.name}, {BUSINESS.addressLines.join(", ")}.
        It is a product, not a large agency and not a marketplace of writers.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">What you actually get</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
        <li>1 credit makes 1 generated article. AI and Humanized cost the same.</li>
        <li>The draft can include meta tags, FAQ schema, links, image prompts and a quality score.</li>
        <li>You can download Word, HTML or Markdown. We do not log into your CMS.</li>
        <li>New accounts start with 10 free credits. Paid credits do not expire.</li>
        <li>If generation fails on our side, the credit comes back.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">What we will not claim</h2>
      <p className="mt-3 text-slate-700">
        We will not promise a Google ranking. Rankings depend on your site, the query, and links
        from other sites. We will not promise a zero score on an AI detector. You should still
        edit the draft before it becomes a public page.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-slate-900">How to reach us</h2>
      <p className="mt-3 text-slate-700">
        Questions about login, credits or a payment go to the{" "}
        <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-700">contact page</Link>.
        We reply within 1 business day, Monday to Saturday, India time. Prices are on{" "}
        <Link href="/pricing" className="font-medium text-blue-600 hover:text-blue-700">pricing</Link>.
        The credit rules are on the{" "}
        <Link href="/refunds" className="font-medium text-blue-600 hover:text-blue-700">refund policy</Link>.
      </p>

      <div className="mt-12 rounded-xl bg-blue-600 p-8 text-center text-white">
        <h2 className="text-2xl font-semibold">Try one real keyword first</h2>
        <p className="mt-2 text-blue-100">10 free articles. No card. No ranking promise.</p>
        <Link
          href="/register"
          className="mt-5 inline-flex items-center rounded-lg bg-white px-6 py-2.5 font-medium text-blue-700 hover:bg-blue-50"
        >
          Create free account
        </Link>
      </div>
    </div>
  );
}
