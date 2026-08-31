"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle, FileText, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/ui/use-toast";

type SavedJob = { id: string; title: string; company: string };

export function PrepForm({
  savedJobs,
  hasResume,
  aiEnabled,
  defaults,
}: {
  savedJobs: SavedJob[];
  hasResume: boolean;
  aiEnabled: boolean;
  defaults: { savedJobId?: string; company?: string; role?: string };
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [savedJobId, setSavedJobId] = React.useState(defaults.savedJobId || "");
  const [company, setCompany] = React.useState(defaults.company || "");
  const [role, setRole] = React.useState(defaults.role || "");
  const [jobDescription, setJobDescription] = React.useState("");
  const [publicNotes, setPublicNotes] = React.useState("");
  const [useResume, setUseResume] = React.useState(hasResume);
  const [loading, setLoading] = React.useState(false);

  // When a saved job is chosen, prefill company/role and lock manual entry.
  const selectedJob = savedJobs.find((j) => j.id === savedJobId);
  React.useEffect(() => {
    if (selectedJob) {
      setCompany(selectedJob.company);
      setRole(selectedJob.title);
    }
  }, [selectedJob]);

  const canSubmit = aiEnabled && company.trim() && role.trim() && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ report: { id: string } }>("/api/prep/generate", {
        method: "POST",
        body: JSON.stringify({
          savedJobId: savedJobId || undefined,
          company,
          role,
          jobDescription: jobDescription || undefined,
          publicNotes: publicNotes || undefined,
          useResume,
        }),
      });
      toast({ variant: "success", title: "Report ready", description: `${role} at ${company}` });
      router.push(`/prep/${res.report.id}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't generate report",
        description: err instanceof Error ? err.message : "Please try again.",
      });
      setLoading(false);
    }
  }

  if (loading) return <GeneratingState company={company} role={role} />;

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardContent className="space-y-6 p-6">
          {!aiEnabled && (
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                AI generation is disabled because <code className="font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
                isn&apos;t set on the server. Add it to enable prep reports.
              </span>
            </div>
          )}

          {savedJobs.length > 0 && (
            <div className="space-y-1.5">
              <Label>Start from a saved job (optional)</Label>
              <Select value={savedJobId || "none"} onValueChange={(v) => setSavedJobId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved job…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Enter manually</SelectItem>
                  {savedJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {j.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                required
                disabled={Boolean(selectedJob)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Backend Engineer"
                required
                disabled={Boolean(selectedJob)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jd">
              Job description <span className="text-muted-foreground">(optional, improves accuracy)</span>
            </Label>
            <Textarea
              id="jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here…"
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Public notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              value={publicNotes}
              onChange={(e) => setPublicNotes(e.target.value)}
              placeholder="Anything you've read about their process — Glassdoor/Blind snippets, a recruiter's email, etc. We reason from what you paste (we don't scrape these sites)."
              className="min-h-[90px]"
            />
          </div>

          {hasResume && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-muted/50 p-3">
              <input
                type="checkbox"
                checked={useResume}
                onChange={(e) => setUseResume(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[hsl(var(--accent))]"
              />
              <span className="text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="h-4 w-4 text-accent" /> Tailor to my resume
                </span>
                <span className="text-muted-foreground">
                  Use your uploaded resume so advice matches your background.
                </span>
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={!canSubmit}>
          <Wand2 className="h-4 w-4" /> Generate prep report
        </Button>
      </div>
    </form>
  );
}

function GeneratingState({ company, role }: { company: string; role: string }) {
  const steps = [
    "Analyzing the role and company type…",
    "Mapping the likely interview process…",
    "Selecting topics to review…",
    "Writing tailored practice questions…",
    "Assembling your report…",
  ];
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-accent/20" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-inset ring-accent/30">
            <Sparkles className="h-7 w-7" />
          </div>
        </div>
        <h3 className="font-display text-lg font-semibold">
          Building your prep for {role} at {company}
        </h3>
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {steps[step]}
        </motion.p>
        <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-surface-muted">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: "8%" }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">This usually takes 10–25 seconds.</p>
      </CardContent>
    </Card>
  );
}
