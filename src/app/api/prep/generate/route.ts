import { handler, json, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { generatePrepSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { features } from "@/lib/env";
import { generatePrepReport } from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow time for generation on Vercel

export const POST = handler(async (req: Request) => {
  const user = await requireUser();

  if (!features.anthropic) {
    throw new ApiError(
      503,
      "AI prep is not configured on the server. Set ANTHROPIC_API_KEY to enable it.",
      "AI_DISABLED"
    );
  }

  const rl = rateLimit(
    `prepGenerate:${user.id}`,
    RATE_LIMITS.prepGenerate.limit,
    RATE_LIMITS.prepGenerate.windowMs
  );
  if (!rl.success) {
    throw new ApiError(
      429,
      "You've generated a lot of reports recently. Try again a little later.",
      "RATE_LIMITED"
    );
  }

  const input = generatePrepSchema.parse(await req.json());

  // If tied to a saved job, pull its snapshot + verify ownership.
  let savedJob = null;
  if (input.savedJobId) {
    savedJob = await db.savedJob.findUnique({ where: { id: input.savedJobId } });
    if (!savedJob || savedJob.userId !== user.id) {
      throw new ApiError(404, "Saved job not found.", "NOT_FOUND");
    }
  }

  const company = savedJob?.company || input.company;
  const role = savedJob?.title || input.role;
  const jobDescription = input.jobDescription || savedJob?.description || null;

  // Optionally include the user's parsed resume for tailoring.
  let resumeText: string | null = null;
  if (input.useResume) {
    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: { resumeText: true },
    });
    resumeText = profile?.resumeText ?? null;
  }

  // Create the report row up front (PENDING) so a slow/failed generation is trackable.
  const report = await db.prepReport.create({
    data: {
      userId: user.id,
      savedJobId: savedJob?.id ?? null,
      company,
      role,
      jobDescription,
      publicNotes: input.publicNotes ?? null,
      status: "PENDING",
    },
  });

  try {
    const generated = await generatePrepReport({
      company,
      role,
      jobDescription,
      publicNotes: input.publicNotes,
      resumeText,
    });

    const updated = await db.prepReport.update({
      where: { id: report.id },
      data: {
        status: "READY",
        summary: generated.summary,
        assessmentType: generated.assessmentType,
        topics: generated.topics,
        sampleQuestions: generated.sampleQuestions,
        markdown: generated.markdown,
      },
    });

    // Move the linked job into "in progress".
    if (savedJob && savedJob.status === "NOT_STARTED") {
      await db.savedJob.update({ where: { id: savedJob.id }, data: { status: "IN_PROGRESS" } });
    }

    return json({ report: updated }, { status: 201 });
  } catch (err) {
    await db.prepReport.update({
      where: { id: report.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : "Generation failed" },
    });
    throw new ApiError(
      502,
      "The AI couldn't generate your report just now. Please try again.",
      "GENERATION_FAILED"
    );
  }
});
