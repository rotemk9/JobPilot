import type { JobListing, JobProvider, JobSearchParams } from "./types";
import { extractTags, inferSeniority } from "./normalize";

/**
 * Mock job provider — a realistic, deterministic dataset so the whole app is
 * fully usable before you sign up for any external API. Swap for (or fall back
 * from) the Adzuna provider by configuring ADZUNA_* env vars.
 */

const COMPANIES = [
  { name: "Vercel", blurb: "the platform for frontend developers" },
  { name: "Linear", blurb: "the issue tracker teams love" },
  { name: "Stripe", blurb: "economic infrastructure for the internet" },
  { name: "Notion", blurb: "the connected workspace" },
  { name: "Figma", blurb: "collaborative interface design" },
  { name: "Ramp", blurb: "finance automation that saves companies time and money" },
  { name: "Retool", blurb: "the fastest way to build internal tools" },
  { name: "Supabase", blurb: "the open source Firebase alternative" },
  { name: "PlanetScale", blurb: "the database for developers" },
  { name: "Anthropic", blurb: "AI safety and research" },
  { name: "Datadog", blurb: "monitoring and security for cloud applications" },
  { name: "Airbnb", blurb: "belong anywhere" },
];

const ROLES: { title: string; stack: string[]; kind: string }[] = [
  { title: "Frontend Engineer", stack: ["React", "TypeScript", "Next.js", "Tailwind"], kind: "coding" },
  { title: "Senior Frontend Engineer", stack: ["React", "TypeScript", "Next.js", "GraphQL"], kind: "coding" },
  { title: "Backend Engineer", stack: ["Go", "Postgres", "gRPC", "Kubernetes"], kind: "coding" },
  { title: "Senior Backend Engineer", stack: ["Python", "FastAPI", "Postgres", "Redis"], kind: "coding" },
  { title: "Full Stack Engineer", stack: ["Node", "React", "TypeScript", "AWS"], kind: "coding" },
  { title: "Staff Software Engineer", stack: ["Distributed Systems", "Go", "Kafka"], kind: "system-design" },
  { title: "Product Engineer", stack: ["TypeScript", "React", "Prisma"], kind: "coding" },
  { title: "Data Engineer", stack: ["Python", "Spark", "Airflow", "Snowflake"], kind: "coding" },
  { title: "Machine Learning Engineer", stack: ["Python", "PyTorch", "MLOps"], kind: "coding" },
  { title: "DevOps Engineer", stack: ["Terraform", "AWS", "Kubernetes", "Docker"], kind: "coding" },
  { title: "Product Manager", stack: ["Roadmapping", "Analytics", "Strategy"], kind: "case-study" },
  { title: "Product Designer", stack: ["Figma", "Prototyping", "Design Systems"], kind: "portfolio" },
];

const LOCATIONS = [
  { city: "San Francisco, CA", remote: false },
  { city: "New York, NY", remote: false },
  { city: "Remote (US)", remote: true },
  { city: "Remote (Global)", remote: true },
  { city: "London, UK", remote: false },
  { city: "Austin, TX", remote: false },
  { city: "Berlin, DE", remote: false },
  { city: "Remote (EU)", remote: true },
];

const SALARY_BANDS: Record<string, [number, number]> = {
  junior: [90000, 130000],
  mid: [120000, 165000],
  senior: [160000, 220000],
  lead: [200000, 280000],
};

function seniorityFromTitle(title: string): string {
  return inferSeniority(title) ?? "mid";
}

// Deterministic pseudo-random so results are stable per index.
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 999 + salt * 17.13) * 10000;
  return x - Math.floor(x);
}

function buildDataset(): JobListing[] {
  const jobs: JobListing[] = [];
  let i = 0;
  for (const company of COMPANIES) {
    for (const role of ROLES) {
      // Not every company posts every role — thin it out deterministically.
      if (seeded(i, 3) > 0.42) {
        i++;
        continue;
      }
      const loc = LOCATIONS[Math.floor(seeded(i, 5) * LOCATIONS.length)];
      const seniority = seniorityFromTitle(role.title);
      const [lo, hi] = SALARY_BANDS[seniority];
      const salaryMin = Math.round((lo + seeded(i, 7) * 8000) / 1000) * 1000;
      const salaryMax = Math.round((hi + seeded(i, 9) * 12000) / 1000) * 1000;
      const daysAgo = Math.floor(seeded(i, 11) * 34); // 0–34 days -> exercises freshness filter
      const postedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const description = `${company.name} is ${company.blurb}. We're hiring a ${role.title} to help build and scale our product. You'll work across the stack with technologies like ${role.stack.join(", ")}, collaborate closely with design and product, and own features end to end. We value strong communication, a bias for shipping, and a high bar for craft.\n\nWhat you'll do:\n- Design, build, and ship user-facing features\n- Partner with cross-functional teams on scope and trade-offs\n- Improve reliability, performance, and developer experience\n\nWhat we look for:\n- Solid experience with ${role.stack.slice(0, 2).join(" and ")}\n- A track record of shipping quality software\n- Curiosity and ownership`;

      jobs.push({
        source: "mock",
        sourceId: `mock-${i}`,
        title: role.title,
        company: company.name,
        location: loc.city,
        remote: loc.remote,
        url: `https://example.com/jobs/${company.name.toLowerCase()}-${i}`,
        description,
        salaryMin,
        salaryMax,
        currency: "USD",
        seniority,
        tags: extractTags(`${role.title} ${role.stack.join(" ")}`),
        postedAt,
      });
      i++;
    }
  }
  return jobs;
}

const DATASET = buildDataset();

export class MockJobProvider implements JobProvider {
  readonly name = "mock";
  isConfigured() {
    return true; // always available
  }

  async search(params: JobSearchParams): Promise<{ jobs: JobListing[]; total: number }> {
    const q = (params.query || "").toLowerCase().trim();
    const locQ = (params.location || "").toLowerCase().trim();

    let results = DATASET.filter((job) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.tags.some((t) => t.toLowerCase().includes(q)) ||
        job.description.toLowerCase().includes(q);
      const matchesLoc =
        !locQ || (job.location ?? "").toLowerCase().includes(locQ) || (job.remote && "remote".includes(locQ));
      return matchesQuery && matchesLoc;
    });

    // Simulate a small network delay so loading states are visible in dev.
    await new Promise((r) => setTimeout(r, 220));

    const total = results.length;
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 12;
    const start = (page - 1) * perPage;
    return { jobs: results.slice(start, start + perPage), total };
  }
}
