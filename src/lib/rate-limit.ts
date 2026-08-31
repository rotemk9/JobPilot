/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Good enough for a single-region serverless deployment and for controlling
 * cost on the Claude + job-search APIs. For multi-region / high scale, swap the
 * store for Upstash Redis (@upstash/ratelimit) — the call sites won't change.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the map doesn't grow unbounded on long-lived lambdas.
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * @param key      unique identifier, typically `${routeName}:${userId}`
 * @param limit    max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, limit, resetAt };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, limit, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, limit, resetAt: bucket.resetAt };
}

/** Common presets (per user, per window). Tune these to your budget. */
export const RATE_LIMITS = {
  jobSearch: { limit: 30, windowMs: 60_000 }, // 30 searches / min
  prepGenerate: { limit: 8, windowMs: 60 * 60_000 }, // 8 reports / hour
  interview: { limit: 60, windowMs: 60 * 60_000 }, // 60 mock-interview turns / hour
  resume: { limit: 10, windowMs: 60 * 60_000 },
} as const;
