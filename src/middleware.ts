import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Middleware runs BEFORE every page and API route.
// It checks the session cookie shape here (fast gate).
// The real check happens on the server via requireAuth().
// Iron-session cookies always start with "Fe26.".

const SESSION_COOKIE = "seo_writer_session";

const PUBLIC_PAGES = ["/", "/serp", "/login", "/register", "/pricing", "/terms", "/privacy", "/forgot-password", "/reset-password", "/refunds", "/contact", "/about", "/support", "/verify", "/opengraph-image", "/icon", "/apple-icon"];
const PUBLIC_APIS = ["/api/health", "/api/auth", "/api/serp", "/api/billing/webhook", "/api/contact"];


export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Public APIs: no check needed (including all /api/auth/* endpoints).
  if (PUBLIC_APIS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Public pages: no check needed.
  if (PUBLIC_PAGES.includes(pathname) || pathname.startsWith("/features") || pathname.startsWith("/blog")) {
    return NextResponse.next();
  }

  // Next.js internals, images, favicon: never touch.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    /\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?|txt|xml)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Global API speed breaker: 120 requests per minute per IP.
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const gate = checkRateLimit(`api:${ip}`, 120, 60_000);
    if (!gate.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Slow down a little." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
      );
    }
  }
  // Is there a session cookie?
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const looksValid = Boolean(cookie && cookie.startsWith("Fe26."));

  // API route: send 401 JSON (never redirect, it would break fetch calls).
  if (pathname.startsWith("/api/")) {
    if (!looksValid) {
      return NextResponse.json(
        { success: false, message: "Login required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Page: send to login, and remember where the user wanted to go.
  if (!looksValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
