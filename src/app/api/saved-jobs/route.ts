import { handler, json, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { jobListingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/saved-jobs — list the current user's saved jobs. */
export const GET = handler(async () => {
  const user = await requireUser();
  const jobs = await db.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prepReports: true } },
    },
  });
  return json({ jobs });
});

/** POST /api/saved-jobs — bookmark a listing (idempotent per user+source+sourceId). */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const listing = jobListingSchema.parse(body);

  const existing = await db.savedJob.findUnique({
    where: {
      userId_source_sourceId: {
        userId: user.id,
        source: listing.source,
        sourceId: listing.sourceId,
      },
    },
  });
  if (existing) {
    return json({ job: existing, alreadySaved: true });
  }

  const job = await db.savedJob.create({
    data: {
      userId: user.id,
      source: listing.source,
      sourceId: listing.sourceId,
      title: listing.title,
      company: listing.company,
      location: listing.location ?? null,
      remote: listing.remote ?? false,
      url: listing.url ?? null,
      description: listing.description,
      salaryMin: listing.salaryMin ?? null,
      salaryMax: listing.salaryMax ?? null,
      currency: listing.currency ?? "USD",
      seniority: listing.seniority ?? null,
      tags: listing.tags ?? [],
      postedAt: listing.postedAt ? new Date(listing.postedAt) : null,
    },
  });

  return json({ job, alreadySaved: false }, { status: 201 });
});
