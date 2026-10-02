import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, keywords, contents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Plus, FileText, TrendingUp, PenLine } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";



export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projectList = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: desc(projects.createdAt),
    limit: 6,
  });

  const recentContent = await db.query.contents.findMany({
    where: eq(contents.projectId, sql`(SELECT id FROM projects WHERE user_id = ${user.id} LIMIT 1)`),
    orderBy: desc(contents.createdAt),
    limit: 5,
    with: { project: true, keyword: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
       <Breadcrumbs />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-600">Welcome back, {user.name}. You have {user.credits} credits.</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>
 {user.credits <= 2 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Only <strong>{user.credits} credits</strong> left — 1 credit makes 1 article.{" "}
          <Link href="/billing" className="font-medium text-amber-900 underline hover:text-amber-700">
            Top up
          </Link>{" "}
          to keep publishing.
        </div>
      )}
       <Link
        href="/human/new"
        className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 transition hover:border-emerald-300 hover:bg-emerald-100"
      >
        <span className="flex items-center gap-3">
          <PenLine className="h-5 w-5 shrink-0 text-emerald-700" />
          <span className="text-sm text-slate-800">
            <strong className="font-semibold">Prefer writing yourself?</strong> Write a human article — 100% your words, free forever.
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-emerald-700">Write now →</span>
      </Link>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectList.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{project.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{project.websiteUrl}</p>
              </div>
              <FileText className="h-5 w-5 text-slate-300 group-hover:text-blue-500" />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">
                {project.language?.toUpperCase() || "EN"} · {project.targetCountry || "IN"}
              </span>
            </div>
          </Link>
        ))}

         {projectList.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Make your first article in 3 steps</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                <span><strong>Create a project</strong> for your website (name + URL + what you sell).</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
                <span><strong>Add keywords</strong> — upload a CSV/Excel file or paste a list.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">3</span>
                <span><strong>Click Make content</strong> on any keyword — article ready in ~3 minutes.</span>
              </li>
            </ol>
            <Link
              href="/projects/new"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Create your first project
            </Link>

          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Recent content</h2>
        {recentContent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No articles yet. Pick a keyword from a project to make content.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {recentContent.map((content) => (
              <Link
                key={content.id}
                href={`/contents/${content.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{content.title || content.h1 || "Untitled"}</p>
                  <p className="text-xs text-slate-500">
                    {content.keyword?.keyword} · {content.wordCount} words · {content.status}
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
