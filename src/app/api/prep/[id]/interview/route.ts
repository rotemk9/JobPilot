import { requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { features } from "@/lib/env";
import { streamInterviewTurn, type ChatTurn } from "@/lib/anthropic";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().max(6000).optional(),
});

/**
 * POST /api/prep/:id/interview
 * Streams the interviewer's next turn as plain text. If `message` is provided,
 * it's persisted as the candidate's turn first; the assistant reply is persisted
 * once the stream completes.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    if (!features.anthropic) {
      throw new ApiError(503, "AI mock interview is not configured on the server.", "AI_DISABLED");
    }

    const rl = rateLimit(`interview:${user.id}`, RATE_LIMITS.interview.limit, RATE_LIMITS.interview.windowMs);
    if (!rl.success) {
      throw new ApiError(429, "Too many messages right now. Give it a minute.", "RATE_LIMITED");
    }

    const report = await db.prepReport.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!report || report.userId !== user.id) {
      throw new ApiError(404, "Prep report not found.", "NOT_FOUND");
    }

    const { message } = bodySchema.parse(await req.json().catch(() => ({})));

    // Persist the candidate's message (if any) and build history.
    const history: ChatTurn[] = report.messages.map((m: (typeof report.messages)[number]) => ({
      role: m.role === "ASSISTANT" ? "assistant" : "user",
      content: m.content,
    }));

    if (message && message.trim()) {
      await db.interviewMessage.create({
        data: { prepReportId: report.id, role: "USER", content: message.trim() },
      });
      history.push({ role: "user", content: message.trim() });
    }

    const stream = await streamInterviewTurn(
      {
        company: report.company,
        role: report.role,
        assessmentType: report.assessmentType,
        reportSummary: report.summary,
      },
      history,
      async (fullText) => {
        await db.interviewMessage.create({
          data: { prepReportId: report.id, role: "ASSISTANT", content: fullText },
        });
      }
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), {
        status: err.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("[interview] route error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
