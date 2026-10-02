import Link from "next/link";

// Shown for unknown URLs (/bla-bla). Returns a proper 404 for Google.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h2>
      <p className="mt-2 text-sm text-slate-600">This address does not exist or was moved.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go home
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View pricing
        </Link>
      </div>
    </div>
  );
}
