import Link from "next/link";
import { cn } from "@/lib/utils";

/** JobPilot mark — a stylized paper-plane inside a rounded accent tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-glow",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M21 3L3 10.5l6.2 2.3L11.5 21l3.1-6.4L21 3z"
          fill="currentColor"
          className="opacity-95"
        />
        <path d="M21 3L9.2 12.8" stroke="hsl(var(--accent))" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-display text-[17px] font-semibold tracking-tight">
        Job<span className="text-gradient-accent">Pilot</span>
      </span>
    </Link>
  );
}
