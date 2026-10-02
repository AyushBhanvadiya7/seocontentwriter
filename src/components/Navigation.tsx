"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  Home,
  Plus,
  Library,
  LogOut,
  Shield,
  Loader2,
  CreditCard,
  Receipt,
  Menu,
  X,
  Search,
} from "lucide-react";

interface NavUser {
  id: number;
  name: string;
  email: string;
  credits: number;
  role: string;
}

// Links for logged-out visitors (marketing pages).
const GUEST_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/support", label: "Support" },
];

export function Navigation({ user }: { user: NavUser | null | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    window.location.href = "/login";
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function isLinkActive(href: string) {
    if (!pathname) return false;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/projects/new") return pathname === "/projects/new";
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const userNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/projects/new", label: "New project", icon: Plus },
    { href: "/serp", label: "SERP Research", icon: Search },
    { href: "/library", label: "Library", icon: Library },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/billing", label: "Billing", icon: Receipt },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href={user ? "/" : "/"}
          onClick={closeMenu}
          className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900"
        >
          <FileText className="h-5 w-5 shrink-0 text-blue-600" />
          <span className="truncate">SEO Content Writer</span>
        </Link>

        {/* Desktop menu: app links for users, marketing links for guests. */}
        {user ? (
          <nav className="hidden items-center gap-6 lg:flex">
            {userNavItems.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm transition ${
                    active
                      ? "font-semibold text-blue-600"
                      : "font-medium text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden items-center gap-7 lg:flex">
            {GUEST_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition ${
                    active
                      ? "font-semibold text-blue-600"
                      : "font-medium text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-500">Credits</p>
                <p className="text-sm font-semibold text-slate-900">{user.credits}</p>
              </div>

              <Link
                href="/settings"
                title="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 hover:bg-blue-200"
              >
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </Link>

              <button
                onClick={logout}
                disabled={loggingOut}
                title="Logout"
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="hidden items-center gap-4 lg:flex">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Start free
              </Link>
            </div>
          )}

          {/* Mobile menu button. */}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel. */}
      {menuOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          {user ? (
            <div className="grid gap-1">
              {[
                ...userNavItems,
                { href: "/settings", label: "Settings", icon: null },
              ].map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "font-medium text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-1">
              {GUEST_LINKS.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "font-medium text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white"
                >
                  Start free
                </Link>
              </div>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}