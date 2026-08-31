import { z } from "zod";

export const jobSearchSchema = z.object({
  query: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  remote: z.enum(["any", "remote", "onsite"]).optional(),
  seniority: z.enum(["any", "junior", "mid", "senior", "lead"]).optional(),
  tech: z.string().max(160).optional(),
  maxAgeDays: z.coerce.number().int().min(1).max(90).optional(),
  page: z.coerce.number().int().min(1).max(50).optional(),
  perPage: z.coerce.number().int().min(1).max(50).optional(),
});

export const jobListingSchema = z.object({
  source: z.string().max(40),
  sourceId: z.string().max(200),
  title: z.string().min(1).max(300),
  company: z.string().min(1).max(200),
  location: z.string().max(200).nullable().optional(),
  remote: z.boolean().optional().default(false),
  url: z.string().url().max(1000).nullable().optional(),
  description: z.string().max(20000),
  salaryMin: z.number().int().nullable().optional(),
  salaryMax: z.number().int().nullable().optional(),
  currency: z.string().max(8).nullable().optional(),
  seniority: z.string().max(40).nullable().optional(),
  tags: z.array(z.string().max(60)).max(20).optional().default([]),
  postedAt: z.string().nullable().optional(),
});

export const prepStatusSchema = z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE"]);

export const generatePrepSchema = z.object({
  savedJobId: z.string().cuid().optional(),
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  jobDescription: z.string().max(20000).optional(),
  publicNotes: z.string().max(10000).optional(),
  useResume: z.boolean().optional().default(true),
});

export const interviewSchema = z.object({
  prepReportId: z.string().cuid(),
  message: z.string().min(1).max(6000),
});

export const profileSchema = z.object({
  name: z.string().max(120).optional(),
  headline: z.string().max(160).optional(),
  location: z.string().max(160).optional(),
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type GeneratePrepInput = z.infer<typeof generatePrepSchema>;
