import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-accent-glow opacity-60" />
      <Logo className="mb-10" />
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
        <Compass className="h-7 w-7" />
      </div>
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Off the flight path</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        We couldn&apos;t find that page. It may have been moved, or the link is out of date.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
