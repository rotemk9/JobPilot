import { handler, json, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ownedReportOr404(userId: string, id: string) {
  const report = await db.prepReport.findUnique({ where: { id } });
  if (!report || report.userId !== userId) {
    throw new ApiError(404, "Prep report not found.", "NOT_FOUND");
  }
  return report;
}

/** GET /api/prep/:id — fetch a report with its interview messages. */
export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await ownedReportOr404(user.id, params.id);
  const report = await db.prepReport.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, savedJob: true },
  });
  return json({ report });
});

/** DELETE /api/prep/:id — remove a report. */
export const DELETE = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await ownedReportOr404(user.id, params.id);
  await db.prepReport.delete({ where: { id: params.id } });
  return json({ ok: true });
});
