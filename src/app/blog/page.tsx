import Link from "next/link";
import Image from "next/image";

// Public blog index. Lists real posts only. No empty coming-soon page.
export const metadata = {
  title: "Notes on Credits, Drafts and Rankings",
  description:
    "Two short notes: what one credit includes, and how to review the draft before you publish. No ranking promises.",
  alternates: { canonical: "/blog" },
};

const POSTS = [
  {
    href: "/blog/review-your-first-article",
    date: "1 October 2026",
    title: "How to review the article one credit just wrote",
    text: "A checklist for facts, meta tags and links. Publish only the version you edited.",
    image: "/blog/review-your-first-article/editor-reading-draft.jpg",
    alt: "Editor reading a printed draft beside a laptop before publishing",
  },
  {
    href: "/blog/what-one-credit-includes",
    date: "1 October 2026",
    title: "What 1 credit includes, and why a ranking is not part of the deal",
    text: "One credit buys a researched draft and the SEO extras. It does not buy a Google ranking.",
    image: "",
    alt: "",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Blog</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
        Notes from the product, not a ranking blog
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        Short pages about what a credit buys and how to review the draft. We will not publish a pile
        of near-copy articles just to fill this list.
      </p>

      <ul className="mt-10 space-y-6">
        {POSTS.map((post) => (
          <li key={post.href} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {post.image ? (
              <Link href={post.href}>
                <Image
                  src={post.image}
                  alt={post.alt}
                  width={1280}
                  height={720}
                  className="aspect-video w-full object-cover"
                />
              </Link>
            ) : null}
            <div className="p-5">
              <p className="text-sm text-slate-500">{post.date}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                <Link href={post.href} className="hover:text-blue-700">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-slate-600">{post.text}</p>
              <Link href={post.href} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
                Read the note
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
