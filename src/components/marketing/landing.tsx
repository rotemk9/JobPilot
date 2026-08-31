"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Search, Sparkles, MessageSquare, Bookmark, ShieldCheck, Zap,
  FileText, Target, Github, Star,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Landing({ authed }: { authed: boolean }) {
  const primaryHref = authed ? "/dashboard" : "/signin";
  const primaryLabel = authed ? "Go to dashboard" : "Get started free";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background flourishes */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-accent-glow opacity-70" />
        <div className="absolute inset-0 bg-grid-slate bg-[size:44px_44px] opacity-[0.15] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      {/* Nav */}
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#trust" className="transition-colors hover:text-foreground">Why JobPilot</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={primaryHref}>{authed ? "Dashboard" : "Get started"}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container relative pt-20 pb-16 text-center sm:pt-28">
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
          <Badge variant="secondary" className="mx-auto mb-6 gap-1.5 py-1">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI-powered interview prep
          </Badge>
        </motion.div>
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          className="mx-auto max-w-4xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
        >
          Find the right job.
          <br />
          <span className="text-gradient-accent">Walk in ready</span> to ace it.
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={2}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          JobPilot surfaces fresh, relevant listings — then uses Claude to build a company-specific
          prep report and run realistic mock interviews, so no assessment catches you off guard.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={3}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href={primaryHref}>
              {primaryLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
            <a href="#how">See how it works</a>
          </Button>
        </motion.div>
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={4}
          className="mt-4 text-xs text-muted-foreground"
        >
          Free to start · No credit card · Bring your own Claude API key
        </motion.p>

        {/* Hero app mock */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <HeroMock />
        </motion.div>
      </section>

      {/* Logo strip / social proof placeholder */}
      <section className="container py-10">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Prep for interviews at companies like
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
          {["Stripe", "Vercel", "Linear", "Figma", "Notion", "Datadog"].map((name) => (
            <span key={name} className="font-display text-lg font-semibold tracking-tight">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <SectionHeading
          eyebrow="Everything in one place"
          title="From search to signed offer"
          description="Two hard problems — finding good roles and preparing for each company's process — handled in a single, focused workflow."
        />
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Search}
            title="Fresh, relevant listings"
            description="Live jobs from legitimate APIs, deduplicated and validated for freshness on every fetch — no stale or closed postings."
            className="lg:col-span-2"
            large
          />
          <FeatureCard
            icon={Bookmark}
            title="Save & track"
            description="Bookmark roles and track prep status: not started, in progress, done."
          />
          <FeatureCard
            icon={Sparkles}
            title="Tailored prep reports"
            description="Claude analyzes the role and predicts the assessment type, key topics, and 6–10 practice questions."
          />
          <FeatureCard
            icon={MessageSquare}
            title="Realistic mock interviews"
            description="A live back-and-forth interviewer that reacts to your answers and gives feedback in real time."
          />
          <FeatureCard
            icon={FileText}
            title="Resume-aware"
            description="Upload your resume and prep is tailored to your actual background and experience."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to interview-ready"
          description="No spreadsheets, no scattered notes. Just search, prep, and practice."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Search, step: "01", title: "Find & save jobs", body: "Search by role, location, stack, and seniority. Bookmark the ones worth pursuing." },
            { icon: Target, step: "02", title: "Generate a prep plan", body: "Pick a saved job or paste a description. Claude builds a company-specific report in seconds." },
            { icon: MessageSquare, step: "03", title: "Run a mock interview", body: "Practice out loud with an AI interviewer that adapts and gives you honest feedback." },
          ].map((s, i) => (
            <motion.div
              key={s.step}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={i}
              className="relative rounded-xl border border-border bg-surface/50 p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/12 text-accent">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-xs text-accent">{s.step}</span>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust / testimonial placeholder */}
      <section id="trust" className="container py-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Built right"
              title="Legitimate sources. Honest AI."
              description="We use official job APIs — never unofficial LinkedIn scraping. And our prep reasons transparently from the info you provide, flagging what's a known fact versus a general expectation."
            />
            <ul className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, t: "ToS-friendly data", d: "Adzuna and other legitimate providers — no scraping that violates terms." },
                { icon: Zap, t: "Cost-aware by design", d: "Caching and rate limits keep your job-API and Claude usage in check." },
                { icon: Target, t: "Calibrated, not made-up", d: "The AI is prompted to distinguish facts from general patterns." },
              ].map((item) => (
                <li key={item.t} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{item.t}</p>
                    <p className="text-sm text-muted-foreground">{item.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-border bg-surface/60 p-8"
          >
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 font-display text-xl font-medium leading-snug tracking-tight">
              &ldquo;I stopped guessing what each company would throw at me. The prep report nailed the
              assessment format, and the mock interview made me way calmer on the day.&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-[hsl(280_90%_70%)]" />
              <div>
                <p className="text-sm font-medium">Your future testimonial</p>
                <p className="text-xs text-muted-foreground">Placeholder — swap in real social proof</p>
              </div>
            </figcaption>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-accent-glow opacity-70" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your next interview shouldn&apos;t be a surprise.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Start finding roles and building tailored prep in minutes.
            </p>
            <Button size="lg" asChild className="mt-8">
              <Link href={primaryHref}>
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JobPilot. Built with Next.js & Claude.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" className="text-sm transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="text-sm transition-colors hover:text-foreground">Terms</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left")}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  large,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
  large?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUp}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-surface/50 p-6 transition-colors hover:border-accent/40",
        className
      )}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/12 text-accent transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={cn("font-display font-semibold tracking-tight", large ? "text-xl" : "text-lg")}>
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}

/** A small, non-interactive product preview for the hero. */
function HeroMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card-hover">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-muted/60 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/60" />
        <span className="h-3 w-3 rounded-full bg-warning/60" />
        <span className="h-3 w-3 rounded-full bg-success/60" />
        <span className="ml-3 rounded-md bg-surface px-2 py-0.5 text-2xs text-muted-foreground">
          jobpilot.app/prep
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 text-left sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-muted/40 p-4 sm:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Backend Engineer · Stripe</p>
              <p className="text-2xs text-muted-foreground">Prep report · System design + coding</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["Distributed systems & idempotency", "API design & rate limiting", "SQL & data modeling"].map((t, i) => (
              <div key={t} className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/15 text-2xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-muted/40 p-4">
          <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Mock interview</p>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg rounded-tl-sm bg-surface px-3 py-2 text-xs">
              Walk me through designing a rate limiter.
            </div>
            <div className="ml-6 rounded-lg rounded-tr-sm bg-accent px-3 py-2 text-xs text-accent-foreground">
              I&apos;d start with a token-bucket per key…
            </div>
            <div className="rounded-lg rounded-tl-sm bg-surface px-3 py-2 text-xs text-muted-foreground">
              Good — how do you handle it across regions?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
