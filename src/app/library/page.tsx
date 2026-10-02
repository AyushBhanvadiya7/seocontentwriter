import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { contents, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { PenLine } from "lucide-react";
import LibraryList from "./LibraryList";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    columns: { id: true },
  });
  const projectIds = userProjects.map((p) => p.id);

  const rows = projectIds.length
    ? await db.query.contents.findMany({
        where: inArray(contents.projectId, projectIds),
        with: {
          project: { columns: { name: true } },
          keyword: { columns: { keyword: true } },
        },
        orderBy: desc(contents.createdAt),
        limit: 100,
      })
    : [];

  const items = rows.map((row) => ({
    id: row.id,
    title: row.title,
    h1: row.h1,
    wordCount: row.wordCount || 0,
    qualityScore: row.qualityScore,
    status: row.status,
    briefId: row.briefId,
    keyword: row.keyword?.keyword || "",
    projectName: row.project?.name || "",
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Content library</h1>
          <p className="text-sm text-slate-600">All your generated articles, exports and statuses.</p>
        </div>
        <Link
          href="/human/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <PenLine className="h-4 w-4" /> Write human article
        </Link>
      </div>

      <LibraryList initialItems={items} />
    </div>
  );
}
