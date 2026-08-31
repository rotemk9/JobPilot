import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PrepReportView } from "@/components/prep/prep-report-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const report = await db.prepReport.findUnique({
    where: { id: params.id },
    select: { role: true, company: true },
  });
  return { title: report ? `${report.role} · ${report.company}` : "Prep report" };
}

export default async function PrepReportPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const report = await db.prepReport.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      savedJob: { select: { id: true, url: true } },
    },
  });

  if (!report || report.userId !== session!.user.id) notFound();

  return (
    <PrepReportView
      candidateName={session!.user.name}
      report={{
        id: report.id,
        company: report.company,
        role: report.role,
        status: report.status,
        summary: report.summary,
        assessmentType: report.assessmentType,
        topics: report.topics,
        sampleQuestions: report.sampleQuestions,
        markdown: report.markdown,
        error: report.error,
        savedJob: report.savedJob,
      }}
      initialMessages={report.messages.map((m: (typeof report.messages)[number]) => ({
        role: m.role === "ASSISTANT" ? "assistant" : "user",
        content: m.content,
      }))}
    />
  );
}
