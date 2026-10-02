"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Auto breadcrumb from the URL path. Any page just renders <Breadcrumbs />.
// IDs become friendly labels; links never point to pages that don't exist.
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  new: "New project",
  keywords: "Keywords",
  links: "Links",
  clusters: "Clusters",
  insights: "Insights",
  "brand-voice": "Brand voice",
  contents: "Articles",
  library: "Library",
  billing: "Billing",
  invoice: "Invoice",
  settings: "Settings",
  human: "Write human",
  admin: "Admin",
  users: "Users",
  content: "Content",
  payments: "Payments",
  inbox: "Inbox",
  issues: "Issues",
  health: "Health",
  prompts: "Prompts",
  exports: "Exports",
  support: "Support",
  pricing: "Pricing",
};

// Some sections have no index page — point their crumb at the real list page.
const LINK_FIX: Record<string, string> = {
  projects: "/dashboard",
  contents: "/library",
  human: "/dashboard",
  invoice: "/billing",
};

function labelFor(seg: string, parent: string): string {
  if (LABELS[seg]) return LABELS[seg];
  if (parent === "projects") return "Project";
  if (parent === "contents") return "Article";
  if (parent === "users") return "User";
  if (parent === "invoice") return "Invoice";
  return "Details";
}

export function Breadcrumbs() {
  const pathname = usePathname() || "/dashboard";
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;

  const crumbs = segs.map((seg, i) => {
    const href = `/${segs.slice(0, i + 1).join("/")}`;

    const last = i === segs.length - 1;
    const parent = i > 0 ? segs[i - 1] : "";
    return { label: labelFor(seg, parent), href: !last && LINK_FIX[seg] ? LINK_FIX[seg] : href, last };
  });

  // App pages hang under Dashboard, not the marketing home.
  const showHome = segs[0] !== "dashboard";

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-500">
      {showHome && (
        <>
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-blue-600">
            <Home className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </>
      )}
      {crumbs.map((c, i) => (
        <span key={`${c.href}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          {c.last ? (
            <span className="font-medium text-slate-700">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-blue-600">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}