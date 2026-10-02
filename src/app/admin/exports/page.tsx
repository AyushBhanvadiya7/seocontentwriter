import { Download } from "lucide-react";

const CARDS = [
  { type: "users", title: "Users", hint: "Every account: name, email, role, plan, credits, status." },
  { type: "orders", title: "Orders", hint: "Every payment: plan, amount, status, gateway reference." },
  { type: "articles", title: "Articles", hint: "Every article: title, keyword, project, owner, status." },
];

export default function AdminExportsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Exports</h1>
      <p className="text-sm text-slate-600">Download site data as CSV. Opens in Excel. Up to 5000 rows per file.</p>
      <div className="mt-4 space-y-3">
        {CARDS.map((c) => (
          <div
            key={c.type}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="font-medium text-slate-900">{c.title}</p>
              <p className="text-sm text-slate-500">{c.hint}</p>
            </div>
            <a
              href={`/api/admin/exports?type=${c.type}`}
              download
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              <Download className="h-4 w-4" /> Download CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
