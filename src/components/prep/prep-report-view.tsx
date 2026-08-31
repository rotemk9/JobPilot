"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, Trash2, ExternalLink, ListChecks, HelpCircle, FileText, MessageSquare, AlertCircle, Target,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { MockInterview } from "@/components/prep/mock-interview";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/ui/use-toast";

interface ReportData {
  id: string;
  company: string;
  role: string;
  status: "PENDING" | "READY" | "FAILED";
  summary: string | null;
  assessmentType: string | null;
  topics: string[];
  sampleQuestions: string[];
  markdown: string | null;
  error: string | null;
  savedJob: { id: string; url: string | null } | null;
}

export function PrepReportView({
  report,
  initialMessages,
  candidateName,
}: {
  report: ReportData;
  initialMessages: { role: "user" | "assistant"; content: string }[];
  candidateName?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiFetch(`/api/prep/${report.id}`, { method: "DELETE" });
      toast({ title: "Report deleted" });
      router.push("/prep");
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
              {report.role}
            </h1>
            {report.assessmentType && report.status === "READY" && (
              <Badge variant="default">{report.assessmentType}</Badge>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" /> {report.company}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.savedJob?.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={report.savedJob.url} target="_blank" rel="noopener noreferrer">
                View listing <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this prep report?</DialogTitle>
                <DialogDescription>
                  This permanently removes the report and its mock-interview history. This can&apos;t be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete} loading={deleting}>
                  Delete report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {report.status === "FAILED" ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">Generation failed</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              {report.error || "Something went wrong generating this report."}
            </p>
            <Button asChild className="mt-6">
              <Link href={`/prep/new?company=${encodeURIComponent(report.company)}&role=${encodeURIComponent(report.role)}`}>
                Try again
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="report">
          <TabsList>
            <TabsTrigger value="report">
              <FileText className="mr-1.5 h-4 w-4" /> Prep report
            </TabsTrigger>
            <TabsTrigger value="interview">
              <MessageSquare className="mr-1.5 h-4 w-4" /> Mock interview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Sidebar summary */}
              <div className="space-y-5 lg:order-2">
                {report.summary && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-accent" /> At a glance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{report.summary}</CardContent>
                  </Card>
                )}
                {report.topics.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ListChecks className="h-4 w-4 text-accent" /> Key topics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {report.topics.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xs font-semibold text-accent">
                              {i + 1}
                            </span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Main report */}
              <div className="lg:order-1 lg:col-span-2">
                <Card>
                  <CardContent className="p-5 sm:p-6">
                    {report.markdown ? (
                      <Markdown>{report.markdown}</Markdown>
                    ) : (
                      <p className="text-sm text-muted-foreground">No report content.</p>
                    )}
                  </CardContent>
                </Card>

                {report.sampleQuestions.length > 0 && (
                  <Card className="mt-5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <HelpCircle className="h-4 w-4 text-accent" /> Practice questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-3">
                        {report.sampleQuestions.map((q, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-xs font-semibold text-muted-foreground">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{q}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interview">
            <MockInterview
              reportId={report.id}
              initialMessages={initialMessages}
              candidateName={candidateName}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
