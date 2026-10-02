import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { FeedbackButton } from "./FeedbackButton";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SEO Content Writer";

const PRODUCT_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/support", label: "Support" },
];

const FEATURE_LINKS = [
  { href: "/features/ai-article-generator", label: "AI Article Generator" },
  { href: "/features/keyword-research", label: "Keyword Research" },
  { href: "/features/meta-schema", label: "Meta Tags + Schema" },
  { href: "/features/internal-linking", label: "Internal Linking" },
  { href: "/features/word-export", label: "Word Export" },
  { href: "/features/brand-voice", label: "Brand Voice" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
  { href: "/support", label: "Support" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-blue-600" />
              {APP_NAME}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              Researched, publish-ready SEO articles in minutes — meta tags, schema, internal
              links and Word export included.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Secure UPI &amp; card payments via Razorpay
            </p>
<div className="mt-4">

            <FeedbackButton/>
</div>
          </div>
          <LinkColumn title="Product" links={PRODUCT_LINKS} />
          <LinkColumn title="Features" links={FEATURE_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">Made in India</p>
        </div>
      </div>
    </footer>
  );
}