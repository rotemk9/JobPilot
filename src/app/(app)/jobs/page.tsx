import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { JobsSearch } from "@/components/jobs/jobs-search";

export const metadata: Metadata = { title: "Find jobs" };
export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const session = await auth();
  const saved = await db.savedJob.findMany({
    where: { userId: session!.user.id },
    select: { id: true, source: true, sourceId: true },
  });
  const initialSaved: Record<string, string> = {};
  for (const s of saved) initialSaved[`${s.source}:${s.sourceId}`] = s.id;

  return (
    <div>
      <PageHeader
        title="Find jobs"
        description="Fresh, relevant listings. Bookmark the ones worth prepping for."
      />
      <JobsSearch initialSaved={initialSaved} />
    </div>
  );
}
