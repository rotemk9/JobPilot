import { handler, json, requireUser } from "@/lib/api";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { jobSearchSchema } from "@/lib/validations";
import { searchJobs } from "@/lib/jobs";
import { ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  const user = await requireUser();

  const rl = rateLimit(`jobSearch:${user.id}`, RATE_LIMITS.jobSearch.limit, RATE_LIMITS.jobSearch.windowMs);
  if (!rl.success) {
    throw new ApiError(429, "Too many searches. Please slow down for a moment.", "RATE_LIMITED");
  }

  const { searchParams } = new URL(req.url);
  const parsed = jobSearchSchema.parse(Object.fromEntries(searchParams.entries()));

  const result = await searchJobs({
    query: parsed.query,
    location: parsed.location,
    remote: parsed.remote,
    seniority: parsed.seniority,
    tech: parsed.tech,
    maxAgeDays: parsed.maxAgeDays,
    page: parsed.page,
    perPage: parsed.perPage,
  });

  return json(result, {
    headers: { "X-RateLimit-Remaining": String(rl.remaining) },
  });
});
