"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "keywords", label: "Keywords" },
  { slug: "links", label: "Links" },
  { slug: "brand-voice", label: "Brand Voice" },
  { slug: "clusters", label: "Clusters" },
  { slug: "content", label: "Content" },
  { slug: "insights", label: "Insights" },
];

// Real links, so the URL and breadcrumb change with the section.
export function ProjectTabs({ projectId }: { projectId: number }) {
  const pathname = usePathname() || "";

  return (
    <div className="mt-6 border-b border-slate-200">
      <nav className="flex gap-6 overflow-x-auto">
        {TABS.map((t) => {
          const href = `/projects/${projectId}/${t.slug}`;
          const active = pathname === href || (t.slug === "keywords" && pathname === `/projects/${projectId}`);
          return (
            <Link
              key={t.slug}
              href={href}
              className={`whitespace-nowrap border-b-2 pb-2 text-sm font-medium ${
                active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}