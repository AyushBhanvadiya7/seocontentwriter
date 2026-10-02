import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Server-side guard + sidebar for every /admin/* page.
// The guard runs on the server before anything renders, so it cannot be bypassed.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-56 shrink-0 bg-slate-900 p-4 text-slate-200 md:block">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Admin</p>
        <nav className="mt-3 space-y-1 text-sm">
          <Link href="/admin" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Overview
          </Link>
          <Link href="/admin/users" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Users
          </Link>
          <Link href="/admin/content" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Content
          </Link>
          <Link href="/admin/payments" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Payments
          </Link>
          <Link href="/admin/inbox" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Inbox
          </Link>
          <Link href="/admin/issues" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Issues
          </Link>
          <Link href="/admin/health" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Health
          </Link>
          <Link href="/admin/prompts" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Prompts
          </Link>
          <Link href="/admin/exports" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Exports
          </Link>
          <Link href="/admin/settings" className="block rounded-lg px-3 py-2 hover:bg-slate-800">
            Settings
          </Link>
        </nav>
        <div className="mt-6 border-t border-slate-700 pt-4">
          <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-800">
            Back to site
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-900 px-3 py-2 text-sm text-slate-200 md:hidden">
          <Link href="/admin" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Overview
          </Link>
          <Link href="/admin/users" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Users
          </Link>
          <Link href="/admin/content" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Content
          </Link>
          <Link href="/admin/payments" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Payments
          </Link>
          <Link href="/admin/inbox" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Inbox
          </Link>
          <Link href="/admin/issues" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Issues
          </Link>
          <Link href="/admin/health" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Health
          </Link>
          <Link href="/admin/prompts" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Prompts
          </Link>
          <Link href="/admin/exports" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Exports
          </Link>
          <Link href="/admin/settings" className="rounded-lg px-3 py-1.5 hover:bg-slate-800">
            Settings
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
