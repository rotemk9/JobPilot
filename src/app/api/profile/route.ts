import { handler, json, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** PATCH /api/profile — update basic profile fields. */
export const PATCH = handler(async (req: Request) => {
  const user = await requireUser();
  const data = profileSchema.parse(await req.json());
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name?.trim() || null,
      headline: data.headline?.trim() || null,
      location: data.location?.trim() || null,
    },
    select: { name: true, headline: true, location: true },
  });
  return json({ user: updated });
});
