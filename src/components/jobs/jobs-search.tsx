"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Frown, RefreshCw, Database } from "lucide-react";

import type { JobListing, JobSearchResult } from "@/lib/jobs/types";
import { SENIORITY_OPTIONS, REMOTE_OPTIONS, FRESHNESS_OPTIONS } from "@/lib/jobs/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "@/components/jobs/job-card";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";
import { EmptyState } from "@/components/empty-state";
import { apiFetch, ApiClientError } from "@/lib/client";
import { Badge } from "@/components/ui/badge";

interface Filters {
  query: string;
  location: string;
  remote: string;
  seniority: string;
  tech: string;
  maxAgeDays: string;
}

const DEFAULT_FILTERS: Filters = {
  query: "",
  location: "",
  remote: "any",
  seniority: "any",
  tech: "",
  maxAgeDays: "30",
};

export function JobsSearch({ initialSaved }: { initialSaved: Record<string, string> }) {
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [result, setResult] = React.useState<JobSearchResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savedMap, setSavedMap] = React.useState<Record<string, string>>(initialSaved);
  const [showFilters, setShowFilters] = React.useState(false);

  const runSearch = React.useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (f.query) params.set("query", f.query);
    if (f.location) params.set("location", f.location);
    if (f.remote !== "any") params.set("remote", f.remote);
    if (f.seniority !== "any") params.set("seniority", f.seniority);
    if (f.tech) params.set("tech", f.tech);
    params.set("maxAgeDays", f.maxAgeDays);
    params.set("perPage", "18");

    try {
      const res = await apiFetch<JobSearchResult>(`/api/jobs/search?${params.toString()}`);
      setResult(res);
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.status === 429
          ? "You're searching a bit fast — give it a few seconds."
          : err instanceof Error
            ? err.message
            : "Search failed.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    runSearch(DEFAULT_FILTERS);
  }, [runSearch]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(filters);
  }

  function handleSavedChange(key: string, savedId: string | null) {
    setSavedMap((prev) => {
      const next = { ...prev };
      if (savedId) next[key] = savedId;
      else delete next[key];
      return next;
    });
  }

  const activeFilterCount =
    (filters.remote !== "any" ? 1 : 0) +
    (filters.seniority !== "any" ? 1 : 0) +
    (filters.tech ? 1 : 0) +
    (filters.maxAgeDays !== "30" ? 1 : 0);

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="Role, keyword, or company (e.g. Frontend Engineer)"
              className="h-11 pl-9"
            />
          </div>
          <div className="relative sm:w-56">
            <Input
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              placeholder="Location"
              className="h-11"
            />
          </div>
          <Button type="submit" size="lg" className="h-11" loading={loading}>
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 sm:w-auto"
            onClick={() => setShowFilters((s) => !s)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 min-w-5 justify-center px-1">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Remote"
              value={filters.remote}
              onChange={(v) => setFilters((f) => ({ ...f, remote: v }))}
              options={REMOTE_OPTIONS}
            />
            <FilterSelect
              label="Seniority"
              value={filters.seniority}
              onChange={(v) => setFilters((f) => ({ ...f, seniority: v }))}
              options={SENIORITY_OPTIONS}
            />
            <FilterSelect
              label="Posted within"
              value={filters.maxAgeDays}
              onChange={(v) => setFilters((f) => ({ ...f, maxAgeDays: v }))}
              options={FRESHNESS_OPTIONS}
            />
            <div className="space-y-1.5">
              <Label>Tech stack</Label>
              <Input
                value={filters.tech}
                onChange={(e) => setFilters((f) => ({ ...f, tech: e.target.value }))}
                placeholder="react, typescript"
              />
            </div>
          </div>
        )}
      </form>

      {/* Result meta */}
      {result && !loading && (
        <div className="mb-4 mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {result.jobs.length} {result.jobs.length === 1 ? "job" : "jobs"} matched
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs">
            <Database className="h-3.5 w-3.5" />
            {result.provider === "mock" ? "Demo data" : "Live"} · {result.cached ? "cached" : "fresh"}
          </span>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <JobGridSkeleton count={6} />
        ) : error ? (
          <EmptyState
            icon={<Frown className="h-6 w-6" />}
            title="Search hit a snag"
            description={error}
            action={
              <Button onClick={() => runSearch(filters)}>
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            }
          />
        ) : result && result.jobs.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No jobs match those filters"
            description="Try broadening your search — remove a filter, widen the date range, or search a different role."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  runSearch(DEFAULT_FILTERS);
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result?.jobs.map((job: JobListing, i) => (
              <JobCard
                key={`${job.source}:${job.sourceId}`}
                job={job}
                index={i}
                savedId={savedMap[`${job.source}:${job.sourceId}`] ?? null}
                onSavedChange={handleSavedChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
