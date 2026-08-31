"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MapPin, Building2, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

import type { JobListing } from "@/lib/jobs/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatSalary, timeAgo, truncate } from "@/lib/utils";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/ui/use-toast";

export function JobCard({
  job,
  savedId,
  onSavedChange,
  index = 0,
}: {
  job: JobListing;
  savedId?: string | null;
  onSavedChange?: (key: string, savedId: string | null) => void;
  index?: number;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [localSavedId, setLocalSavedId] = React.useState<string | null>(savedId ?? null);

  React.useEffect(() => setLocalSavedId(savedId ?? null), [savedId]);

  const key = `${job.source}:${job.sourceId}`;
  const isSaved = Boolean(localSavedId);
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency || "USD");

  async function toggleSave() {
    setSaving(true);
    try {
      if (isSaved && localSavedId) {
        await apiFetch(`/api/saved-jobs/${localSavedId}`, { method: "DELETE" });
        setLocalSavedId(null);
        onSavedChange?.(key, null);
        toast({ title: "Removed from saved jobs" });
      } else {
        const res = await apiFetch<{ job: { id: string } }>("/api/saved-jobs", {
          method: "POST",
          body: JSON.stringify(job),
        });
        setLocalSavedId(res.job.id);
        onSavedChange?.(key, res.job.id);
        toast({ variant: "success", title: "Saved", description: `${job.title} at ${job.company}` });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't update",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="group relative flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card-hover">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold leading-snug tracking-tight">
              {job.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0", isSaved && "text-accent")}
            onClick={toggleSave}
            loading={saving}
            aria-label={isSaved ? "Remove bookmark" : "Save job"}
          >
            {!saving && (isSaved ? <BookmarkCheck className="h-[1.15rem] w-[1.15rem]" /> : <Bookmark className="h-[1.15rem] w-[1.15rem]" />)}
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location || "Location N/A"}
          </span>
          {job.remote && <Badge variant="success">Remote</Badge>}
          {job.seniority && <Badge variant="secondary">{job.seniority}</Badge>}
        </div>

        {salary && <p className="mt-3 text-sm font-medium text-foreground">{salary}</p>}

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {truncate(job.description, 200)}
        </p>

        {job.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 5).map((t) => (
              <span key={t} className="rounded-md bg-surface-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
          <span className="text-xs text-muted-foreground">
            {job.postedAt ? timeAgo(job.postedAt) : "Recently posted"}
          </span>
          <div className="flex items-center gap-1.5">
            {job.url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  View <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button
              size="sm"
              asChild
              variant={isSaved ? "default" : "secondary"}
            >
              <Link
                href={
                  localSavedId
                    ? `/prep/new?savedJobId=${localSavedId}`
                    : `/prep/new?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.title)}`
                }
              >
                <Sparkles className="h-3.5 w-3.5" /> Prep
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
