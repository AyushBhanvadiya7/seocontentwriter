"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Pencil, Tags, FileDown } from "lucide-react";

const TABS = [
  { slug: "", label: "Overview", icon: FileText },
  { slug: "edit", label: "Edit Article", icon: Pencil },
  { slug: "seo", label: "SEO & Schema", icon: Tags },
  { slug: "export", label: "Export", icon: FileDown },
];

export function ArticleTabs({ contentId }: { contentId: number }) {
  const pathname = usePathname() || "";

  return (
    <div className="mb-6 border-b border-slate-200">
      <nav className="flex gap-6 overflow-x-auto">
        {TABS.map((t) => {
          const href = t.slug ? `/contents/${contentId}/${t.slug}` : `/contents/${contentId}`;
          const active =
            t.slug === ""
              ? pathname === `/contents/${contentId}`
              : pathname.endsWith(`/${t.slug}`);

          const Icon = t.icon;

          return (
            <Link
              key={t.slug}
              href={href}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition ${
                active
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
