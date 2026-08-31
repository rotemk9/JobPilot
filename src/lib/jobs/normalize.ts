import type { JobListing } from "./types";

/** Infer a coarse seniority bucket from a job title. */
export function inferSeniority(title: string): string | null {
  const t = title.toLowerCase();
  if (/\b(staff|principal|lead|head of|director|vp)\b/.test(t)) return "lead";
  if (/\b(senior|sr\.?|snr)\b/.test(t)) return "senior";
  if (/\b(junior|jr\.?|entry|graduate|intern|associate)\b/.test(t)) return "junior";
  if (/\b(mid|ii|iii)\b/.test(t)) return "mid";
  return null;
}

const TECH_KEYWORDS = [
  "react", "next.js", "nextjs", "typescript", "javascript", "node", "python",
  "go", "golang", "rust", "java", "kotlin", "swift", "ruby", "rails", "django",
  "graphql", "postgres", "mysql", "mongodb", "redis", "kafka", "aws", "gcp",
  "azure", "kubernetes", "docker", "terraform", "tailwind", "vue", "svelte",
  "angular", "django", "fastapi", "spring", ".net", "c#", "c++", "php", "laravel",
];

/** Pull recognizable tech tags out of a title + description. */
export function extractTags(text: string, max = 6): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) {
      found.add(kw === "nextjs" ? "Next.js" : kw === "golang" ? "Go" : titleCase(kw));
      if (found.size >= max) break;
    }
  }
  return Array.from(found);
}

function titleCase(s: string): string {
  if (s.includes(".") || s.includes("#") || s.includes("+")) return s; // .net, c#, c++
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Whether a listing counts as "remote" from its text signals. */
export function looksRemote(text: string): boolean {
  return /\b(remote|work from home|wfh|distributed|anywhere)\b/i.test(text);
}

/**
 * Deduplicate listings that describe the same role. We key on a normalized
 * (company + title + location) tuple, preferring the freshest posting when two
 * collide.
 */
export function dedupe(jobs: JobListing[]): JobListing[] {
  const byKey = new Map<string, JobListing>();
  const norm = (s: string | null) =>
    (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  for (const job of jobs) {
    const key = `${norm(job.company)}::${norm(job.title)}::${norm(job.location)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, job);
      continue;
    }
    const a = existing.postedAt ? Date.parse(existing.postedAt) : 0;
    const b = job.postedAt ? Date.parse(job.postedAt) : 0;
    if (b > a) byKey.set(key, job);
  }
  return Array.from(byKey.values());
}

/**
 * Freshness filter — drop anything older than maxAgeDays. Runs on EVERY fetch
 * (not just first load) so stale/closed postings don't linger in results.
 * Listings with no postedAt are kept (we can't prove they're stale).
 */
export function filterFresh(jobs: JobListing[], maxAgeDays: number): JobListing[] {
  if (!maxAgeDays || maxAgeDays <= 0) return jobs;
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return jobs.filter((j) => {
    if (!j.postedAt) return true;
    const t = Date.parse(j.postedAt);
    return Number.isNaN(t) ? true : t >= cutoff;
  });
}

/** Post-filter by seniority bucket (providers don't all support this natively). */
export function filterSeniority(jobs: JobListing[], seniority?: string): JobListing[] {
  if (!seniority || seniority === "any") return jobs;
  return jobs.filter((j) => (j.seniority ?? inferSeniority(j.title)) === seniority);
}

/** Post-filter by remote/on-site. */
export function filterRemote(jobs: JobListing[], remote?: string): JobListing[] {
  if (!remote || remote === "any") return jobs;
  if (remote === "remote") return jobs.filter((j) => j.remote);
  return jobs.filter((j) => !j.remote);
}

/** Post-filter by tech stack keywords (all provided keywords must appear). */
export function filterTech(jobs: JobListing[], tech?: string): JobListing[] {
  const keywords = (tech || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (keywords.length === 0) return jobs;
  return jobs.filter((j) => {
    const hay = `${j.title} ${j.description} ${j.tags.join(" ")}`.toLowerCase();
    return keywords.every((k) => hay.includes(k));
  });
}
