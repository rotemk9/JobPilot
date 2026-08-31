import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import { PageHeader } from "@/components/app/page-header";
import { PrepForm } from "@/components/prep/prep-form";

export const metadata: Metadata = { title: "New prep report" };
export const dynamic = "force-dynamic";

export default async function NewPrepPage({
  searchParams,
}: {
  searchParams: { savedJobId?: string; company?: string; role?: string };
}) {
  const session = await auth();
  const [savedJobs, user] = await Promise.all([
    db.savedJob.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, company: true },
    }),
    db.user.findUnique({ where: { id: session!.user.id }, select: { resumeText: true } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New prep report"
        description="Claude analyzes the role and builds a tailored interview & assessment plan."
      />
      <PrepForm
        savedJobs={savedJobs}
        hasResume={Boolean(user?.resumeText)}
        aiEnabled={features.anthropic}
        defaults={{
          savedJobId: searchParams.savedJobId,
          company: searchParams.company,
          role: searchParams.role,
        }}
      />
    </div>
  );
}
