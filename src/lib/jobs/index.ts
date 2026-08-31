import { createHash } from "crypto";
import { db } from "@/lib/db";
import type { JobProvider, JobSearchParams, JobSearchResult } from "./types";
import { MockJobProvider } from "./mock-provider";
import { AdzunaJobProvider } from "./adzuna-provider";
import {
  dedupe,
  filterFresh,
  filterRemote,
  filterSeniority,
  filterTech,
} from "./normalize";

export * from "./types";

const adzuna = new AdzunaJobProvider();
const mock = new MockJobProvider();

/** Choose the best available provider. Adzuna if configured, else mock. */
export function getProvider(): JobProvider {
  return adzuna.isConfigured() ? adzuna : mock;
}

export function activeProviderName(): string {
  return getProvider().name;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — short, so freshness stays honest

function cacheKey(provider: string, params: JobSearchParams): string {
  const norm = {
    q: (params.query || "").toLowerCase().trim(),
    loc: (params.location || "").toLowerCase().trim(),
    remote: params.remote || "any",
    seniority: params.seniority || "any",
    tech: (params.tech || "").toLowerCase().trim(),
    age: params.maxAgeDays || 0,
    page: params.page || 1,
    perPage: params.perPage || 12,
  };
  return createHash("sha256").update(`${provider}:${JSON.stringify(norm)}`).digest("hex");
}

/**
 * Search jobs with caching, freshness validation and deduplication applied on
 * EVERY fetch (not just first load). Falls back to the mock provider if the
 * live provider errors, so the UI never hard-fails.
 */
export async function searchJobs(params: JobSearchParams): Promise<JobSearchResult> {
  const provider = getProvider();
  const maxAgeDays = params.maxAgeDays ?? 30;
  const key = cacheKey(provider.name, { ...params, maxAgeDays });

  // 1) Try cache
  try {
    const cached = await db.jobSearchCache.findUnique({ where: { key } });
    if (cached && cached.expiresAt > new Date()) {
      const payload = cached.payload as unknown as JobSearchResult;
      return { ...payload, cached: true };
    }
  } catch {
    // Cache is best-effort; ignore DB hiccups and fetch live.
  }

  // 2) Fetch live (with graceful fallback to mock)
  let raw: { jobs: JobSearchResult["jobs"]; total: number };
  let usedProvider = provider.name;
  try {
    raw = await provider.search({ ...params, maxAgeDays });
  } catch (err) {
    console.error(`[jobs] provider "${provider.name}" failed, falling back to mock:`, err);
    raw = await mock.search({ ...params, maxAgeDays });
    usedProvider = "mock";
  }

  // 3) Validate + filter on every fetch
  let jobs = dedupe(raw.jobs);
  jobs = filterFresh(jobs, maxAgeDays);
  jobs = filterSeniority(jobs, params.seniority);
  jobs = filterRemote(jobs, params.remote);
  jobs = filterTech(jobs, params.tech);

  const result: JobSearchResult = {
    jobs,
    total: raw.total,
    page: params.page ?? 1,
    perPage: params.perPage ?? 12,
    provider: usedProvider,
    cached: false,
  };

  // 4) Write cache (best-effort)
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await db.jobSearchCache.upsert({
      where: { key },
      update: { payload: result as unknown as object, expiresAt },
      create: { key, payload: result as unknown as object, expiresAt },
    });
  } catch {
    // ignore
  }

  return result;
}
