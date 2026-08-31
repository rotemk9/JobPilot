/** Normalized job listing shape used everywhere in the app (provider-agnostic). */
export interface JobListing {
  source: string; // "adzuna" | "mock"
  sourceId: string; // provider-unique id
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  seniority: string | null;
  tags: string[];
  postedAt: string | null; // ISO 8601
}

export type RemoteFilter = "any" | "remote" | "onsite";

export interface JobSearchParams {
  query?: string;
  location?: string;
  remote?: RemoteFilter;
  seniority?: string; // "junior" | "mid" | "senior" | "lead"
  tech?: string; // comma-separated stack keywords
  maxAgeDays?: number; // freshness cutoff
  page?: number; // 1-based
  perPage?: number;
}

export interface JobSearchResult {
  jobs: JobListing[];
  total: number;
  page: number;
  perPage: number;
  provider: string;
  cached: boolean;
}

/** Any job source implements this. Add new providers by implementing it. */
export interface JobProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Return raw (un-deduped) results for a single page. */
  search(params: JobSearchParams): Promise<{ jobs: JobListing[]; total: number }>;
}

export const SENIORITY_OPTIONS = [
  { value: "any", label: "Any level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
] as const;

export const REMOTE_OPTIONS = [
  { value: "any", label: "Anywhere" },
  { value: "remote", label: "Remote only" },
  { value: "onsite", label: "On-site / Hybrid" },
] as const;

export const FRESHNESS_OPTIONS = [
  { value: "3", label: "Past 3 days" },
  { value: "7", label: "Past week" },
  { value: "14", label: "Past 2 weeks" },
  { value: "30", label: "Past month" },
] as const;
