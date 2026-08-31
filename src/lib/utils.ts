import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Human-friendly "x days ago" style relative time. */
export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  const table: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let unit = "second";
  let value = seconds;
  let prev = 1;
  for (const [step, name] of table) {
    if (value < step) {
      unit = name;
      break;
    }
    prev *= step;
    value = seconds / prev;
    unit = name;
  }
  const rounded = Math.max(1, Math.floor(value));
  if (unit === "second" && seconds < 45) return "just now";
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

/** Format a salary range with currency, gracefully handling missing bounds. */
export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency = "USD"
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      notation: n >= 10000 ? "compact" : "standard",
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min || max) as number);
}

/** Stable initials for avatar fallbacks. */
export function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Truncate text at a word boundary. */
export function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max)).trimEnd() + "…";
}

/** Absolute base URL, safe on server and client, for callbacks and metadata. */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type PrepStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

export const PREP_STATUS_LABEL: Record<PrepStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};
