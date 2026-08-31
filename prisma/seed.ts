/**
 * Optional seed: creates a demo user with a couple of saved jobs so the
 * dashboard isn't empty on first run. Safe to run repeatedly (idempotent).
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = "demo@jobpilot.dev";
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      headline: "Senior Frontend Engineer",
      location: "Remote",
    },
  });

  const jobs = [
    {
      source: "mock",
      sourceId: "seed-1",
      title: "Senior Frontend Engineer",
      company: "Vercel",
      location: "Remote (US)",
      remote: true,
      description:
        "Build the platform for the modern web. You'll work on Next.js, the dashboard, and edge tooling.",
      salaryMin: 170000,
      salaryMax: 220000,
      seniority: "Senior",
      tags: ["React", "Next.js", "TypeScript"],
      postedAt: new Date(),
    },
    {
      source: "mock",
      sourceId: "seed-2",
      title: "Product Engineer",
      company: "Linear",
      location: "Remote (Global)",
      remote: true,
      description:
        "Craft the issue tracker top engineering teams love. Deep focus on performance and design quality.",
      salaryMin: 150000,
      salaryMax: 200000,
      seniority: "Mid-Senior",
      tags: ["TypeScript", "React", "GraphQL"],
      postedAt: new Date(),
    },
  ];

  for (const job of jobs) {
    await db.savedJob.upsert({
      where: {
        userId_source_sourceId: { userId: user.id, source: job.source, sourceId: job.sourceId },
      },
      update: {},
      create: { ...job, userId: user.id },
    });
  }

  console.log(`Seeded demo user (${email}) with ${jobs.length} saved jobs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
