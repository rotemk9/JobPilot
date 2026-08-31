import type { JobListing, JobProvider, JobSearchParams } from "./types";
import { env, features } from "@/lib/env";
import { extractTags, inferSeniority, looksRemote } from "./normalize";

/**
 * Adzuna provider. Free, legitimate job-search API.
 * Docs: https://developer.adzuna.com/
 *
 * Sign up for an App ID + App Key and set ADZUNA_APP_ID / ADZUNA_APP_KEY.
 * ADZUNA_COUNTRY defaults to "us" (also: gb, ca, de, au, ...).
 */

interface AdzunaResult {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  category?: { label?: string };
}

interface AdzunaResponse {
  count: number;
  results: AdzunaResult[];
}

export class AdzunaJobProvider implements JobProvider {
  readonly name = "adzuna";

  isConfigured() {
    return features.adzuna;
  }

  async search(params: JobSearchParams): Promise<{ jobs: JobListing[]; total: number }> {
    if (!this.isConfigured()) {
      throw new Error("Adzuna is not configured (missing ADZUNA_APP_ID / ADZUNA_APP_KEY).");
    }

    const country = env.ADZUNA_COUNTRY.toLowerCase();
    const page = Math.max(1, params.page ?? 1);
    const perPage = params.perPage ?? 12;

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`
    );
    url.searchParams.set("app_id", env.ADZUNA_APP_ID!);
    url.searchParams.set("app_key", env.ADZUNA_APP_KEY!);
    url.searchParams.set("results_per_page", String(perPage));
    url.searchParams.set("content-type", "application/json");
    if (params.query) url.searchParams.set("what", params.query);
    if (params.location) url.searchParams.set("where", params.location);
    if (params.remote === "remote") url.searchParams.set("what_or", "remote");
    // Ask Adzuna to only return fresh postings when a cutoff is set.
    if (params.maxAgeDays && params.maxAgeDays > 0) {
      url.searchParams.set("max_days_old", String(params.maxAgeDays));
    }
    url.searchParams.set("sort_by", "date");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      // Cache at the fetch layer too; our app-level cache is the primary one.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Adzuna request failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as AdzunaResponse;

    const jobs: JobListing[] = (data.results || []).map((r) => {
      const description = stripHtml(r.description || "");
      const locationName = r.location?.display_name ?? null;
      const remote =
        looksRemote(`${r.title} ${description} ${locationName ?? ""}`) ||
        params.remote === "remote";
      return {
        source: "adzuna",
        sourceId: String(r.id),
        title: r.title?.trim() || "Untitled role",
        company: r.company?.display_name?.trim() || "Undisclosed company",
        location: locationName,
        remote,
        url: r.redirect_url || null,
        description,
        salaryMin: r.salary_min ? Math.round(r.salary_min) : null,
        salaryMax: r.salary_max ? Math.round(r.salary_max) : null,
        currency: currencyForCountry(country),
        seniority: inferSeniority(r.title || ""),
        tags: extractTags(`${r.title} ${description}`),
        postedAt: r.created || null,
      };
    });

    return { jobs, total: data.count ?? jobs.length };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function currencyForCountry(country: string): string {
  const map: Record<string, string> = {
    us: "USD",
    gb: "GBP",
    ca: "CAD",
    au: "AUD",
    de: "EUR",
    fr: "EUR",
    nl: "EUR",
    in: "INR",
  };
  return map[country] ?? "USD";
}
