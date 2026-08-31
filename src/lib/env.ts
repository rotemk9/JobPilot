/**
 * Central place to read env vars with light validation and helpful errors.
 * We intentionally DON'T hard-crash on missing optional keys so the app can
 * boot in a degraded/demo mode (e.g. mock job provider, no Google login).
 */

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  // Core
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXTAUTH_SECRET: optional("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: optional("NEXTAUTH_URL"),

  // Anthropic
  ANTHROPIC_API_KEY: optional("ANTHROPIC_API_KEY"),
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",

  // Google OAuth
  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),

  // Email (magic link) provider
  EMAIL_SERVER: optional("EMAIL_SERVER"),
  EMAIL_FROM: optional("EMAIL_FROM"),

  // Adzuna job API
  ADZUNA_APP_ID: optional("ADZUNA_APP_ID"),
  ADZUNA_APP_KEY: optional("ADZUNA_APP_KEY"),
  ADZUNA_COUNTRY: process.env.ADZUNA_COUNTRY ?? "us",
} as const;

export const features = {
  google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  email: Boolean(env.EMAIL_SERVER && env.EMAIL_FROM),
  anthropic: Boolean(env.ANTHROPIC_API_KEY),
  adzuna: Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY),
} as const;

/** Throw only for things that are truly required for the process to work. */
export function assertServerEnv() {
  const missing: string[] = [];
  if (!env.NEXTAUTH_SECRET) missing.push("NEXTAUTH_SECRET");
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (missing.length && env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. See .env.example.`
    );
  }
  return missing;
}
