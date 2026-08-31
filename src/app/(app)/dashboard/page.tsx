import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Sparkles, Search, ArrowRight, TrendingUp, CheckCircle2, Clock } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SavedJobRow } from "@/components/dashboard/saved-job-row";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [savedJobs, prepCount, statusCounts] = await Promise.all([
    db.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { prepReports: true } } },
    }),
    db.prepReport.count({ where: { userId } }),
    db.savedJob.groupBy({ by: ["status"], where: { userId }, _count: true }),
  ]);

  const countBy = (s: string) =>
    statusCounts.find((c: (typeof statusCounts)[number]) => c.status === s)?._count ?? 0;
  const firstName = session!.user.name?.split(" ")[0];

  const stats = [
    { label: "Saved jobs", value: savedJobs.length, icon: Bookmark },
    { label: "In progress", value: countBy("IN_PROGRESS"), icon: Clock },
    { label: "Done", value: countBy("DONE"), icon: CheckCircle2 },
    { label: "Prep reports", value: prepCount, icon: Sparkles },
  ];

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Your saved jobs and interview prep, all in one place."
        actions={
          <Button asChild>
            <Link href="/jobs">
              <Search className="h-4 w-4" /> Find jobs
            </Link>
          </Button>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
          </Card>
        ))}
      </div>

      {/* Saved jobs */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Saved jobs</h2>
          {savedJobs.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs">
                Find more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {savedJobs.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-6 w-6" />}
            title="No saved jobs yet"
            description="Search for roles and bookmark the ones you want to prep for. They'll show up here with prep status."
            action={
              <Button asChild>
                <Link href="/jobs">
                  <Search className="h-4 w-4" /> Browse jobs
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {savedJobs.map((job: (typeof savedJobs)[number]) => (
              <SavedJobRow
                key={job.id}
                job={{
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  remote: job.remote,
                  url: job.url,
                  salaryMin: job.salaryMin,
                  salaryMax: job.salaryMax,
                  currency: job.currency,
                  status: job.status,
                  createdAt: job.createdAt.toISOString(),
                  prepCount: job._count.prepReports,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prompt to prep */}
      {savedJobs.length > 0 && prepCount === 0 && (
        <Card className="mt-8 overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
          <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">Turn a saved job into a prep plan</h3>
                <p className="text-sm text-muted-foreground">
                  Generate a tailored interview report and run a mock interview.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/prep/new">
                <Sparkles className="h-4 w-4" /> Start prepping
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
