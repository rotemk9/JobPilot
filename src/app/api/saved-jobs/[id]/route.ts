import { handler, json, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { prepStatusSchema } from "@/lib/validations";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({ status: prepStatusSchema });

async function ownedJobOr404(userId: string, id: string) {
  const job = await db.savedJob.findUnique({ where: { id } });
  if (!job || job.userId !== userId) {
    throw new ApiError(404, "Saved job not found.", "NOT_FOUND");
  }
  return job;
}

/** PATCH /api/saved-jobs/:id — update prep status. */
export const PATCH = handler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await ownedJobOr404(user.id, params.id);
  const { status } = patchSchema.parse(await req.json());
  const job = await db.savedJob.update({ where: { id: params.id }, data: { status } });
  return json({ job });
});

/** DELETE /api/saved-jobs/:id — remove a bookmark. */
export const DELETE = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  await ownedJobOr404(user.id, params.id);
  await db.savedJob.delete({ where: { id: params.id } });
  return json({ ok: true });
});
