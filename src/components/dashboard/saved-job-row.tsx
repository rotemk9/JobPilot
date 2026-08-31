"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Sparkles, Trash2, ExternalLink, Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatSalary, timeAgo } from "@/lib/utils";
import type { PrepStatus } from "@/lib/utils";

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  url: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  status: PrepStatus;
  createdAt: string;
  prepCount: number;
}

const STATUS_VARIANT: Record<PrepStatus, "secondary" | "warning" | "success"> = {
  NOT_STARTED: "secondary",
  IN_PROGRESS: "warning",
  DONE: "success",
};

export function SavedJobRow({ job }: { job: SavedJob }) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<PrepStatus>(job.status);
  const [busy, setBusy] = React.useState(false);
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.currency || "USD");

  async function updateStatus(next: PrepStatus) {
    const prev = status;
    setStatus(next);
    try {
      await apiFetch(`/api/saved-jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
    } catch {
      setStatus(prev);
      toast({ variant: "destructive", title: "Couldn't update status" });
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await apiFetch(`/api/saved-jobs/${job.id}`, { method: "DELETE" });
      toast({ title: "Removed", description: `${job.title} at ${job.company}` });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Couldn't remove job" });
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/30 sm:flex-row sm:items-center sm:justify-between",
        busy && "pointer-events-none opacity-50"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{job.title}</h3>
          <Badge variant={STATUS_VARIANT[status]}>{status.replace("_", " ").toLowerCase()}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {job.company}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {job.location || "N/A"}
          </span>
          {salary && <span>{salary}</span>}
          <span>· saved {timeAgo(job.createdAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-36">
          <Select value={status} onValueChange={(v) => updateStatus(v as PrepStatus)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOT_STARTED">Not started</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" asChild>
          <Link href={`/prep/new?savedJobId=${job.id}`}>
            <Sparkles className="h-3.5 w-3.5" /> Prep
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {job.url && (
              <DropdownMenuItem asChild>
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> View listing
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
              <Trash2 /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
