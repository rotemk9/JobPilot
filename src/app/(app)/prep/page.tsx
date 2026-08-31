import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Plus, ArrowRight, Building2, FileText } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Interview prep" };
export const dynamic = "force-dynamic";

export default async function PrepListPage() {
  const session = await auth();
  const reports = await db.prepReport.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Interview prep"
        description="AI-tailored prep reports and mock interviews for each role."
        actions={
          <Button asChild>
            <Link href="/prep/new">
              <Plus className="h-4 w-4" /> New prep
            </Link>
          </Button>
        }
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No prep reports yet"
          description="Generate a tailored report for any role — pick a saved job or paste a company and job description."
          action={
            <Button asChild>
              <Link href="/prep/new">
                <Plus className="h-4 w-4" /> Create your first report
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reports.map((r: (typeof reports)[number]) => (
            <Link key={r.id} href={`/prep/${r.id}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold tracking-tight">
                      {r.role}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {r.company}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                {r.assessmentType && (
                  <div className="mt-3">
                    <Badge variant="default">{r.assessmentType}</Badge>
                  </div>
                )}

                {r.summary && (
                  <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
                    {truncate(r.summary, 160)}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-3">
                    <span>{timeAgo(r.createdAt)}</span>
                    {r._count.messages > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {r._count.messages} interview turns
                      </span>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "PENDING" | "READY" | "FAILED" }) {
  if (status === "READY") return <Badge variant="success">Ready</Badge>;
  if (status === "FAILED") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="warning">Generating</Badge>;
}
