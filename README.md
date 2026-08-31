# JobPilot ✈️

**Find relevant jobs. Walk into every interview ready.**

JobPilot is a full-stack web app that (1) aggregates fresh, relevant job listings from
legitimate APIs and (2) uses the **Claude API** to build company-specific interview &
assessment prep — tailored reports plus a live mock-interview mode.

Built with Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Supabase Postgres ·
NextAuth · Anthropic Claude. Designed to deploy to **Vercel** with minimal config.

---

## ✨ Features

- **Job search & aggregation** — live listings via [Adzuna](https://developer.adzuna.com/)
  (a legitimate, ToS-friendly API), with filters for role, location, seniority, tech stack,
  and remote/on-site. Results are **deduplicated and freshness-validated on every fetch**, and
  cached to control cost. Ships with a realistic **built-in demo dataset**, so the app works
  fully before you sign up for any external API.
- **AI interview prep (the differentiator)** — pick a saved job or paste a company + job
  description, and Claude generates a tailored report: likely **assessment type**, prioritized
  **topics**, and **6–10 practice questions**. It reasons transparently from the info *you*
  provide (job description + any public notes you paste) — it does **not** scrape Glassdoor/Blind.
- **Mock interview mode** — a streaming, back-and-forth AI interviewer that reacts to your
  answers and gives feedback, tailored to the exact role.
- **Dashboard** — saved jobs with prep status (not started / in progress / done) and stats.
- **Profile & resume** — optional resume upload (PDF/text), parsed to plain text and used to
  tailor prep prompts.
- **Premium UI** — deep-slate + electric-accent design system, dark mode as a first-class
  citizen, custom design tokens, Framer Motion micro-interactions, loading skeletons, and
  custom empty/error states. Fully responsive and mobile-first.
- **Production concerns** — auth-guarded routes, consistent API error handling, per-user rate
  limiting, DB-backed caching, and documented environment variables.

---

## 🧱 Tech stack & key decisions

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 14 App Router + TS | Serverless-friendly, one repo for UI + API |
| Styling | Tailwind + custom tokens + shadcn-style primitives (Radix) | Custom look, not a default template |
| DB | **Supabase Postgres** + Prisma | Great DX, pooled connections for serverless, NextAuth adapter |
| Auth | NextAuth (Google + Email magic link), **database sessions** | Standard, secure, provider-flexible |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) | Report generation + streaming mock interview |
| Jobs | Adzuna provider + mock provider behind one interface | Legitimate data; swap/extend providers easily |

> **Why database sessions?** With the Prisma adapter we use `session.strategy = "database"`.
> Route protection is done in server components/layouts (`src/app/(app)/layout.tsx`) and in each
> API route via `requireUser()` — robust with database sessions (no JWT middleware needed).

---

## 🚀 Quick start (local)

### 0. Prerequisites
- Node.js ≥ 18.18
- A Supabase project (free tier is fine) — https://supabase.com

### 1. Install
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in `.env` (see **Environment variables** below). At minimum you need `DATABASE_URL`,
`DIRECT_URL`, `NEXTAUTH_SECRET`, one auth provider, and `ANTHROPIC_API_KEY` for AI features.

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Set up the database
```bash
npm run db:push        # creates all tables from prisma/schema.prisma
# optional: seed a demo user + saved jobs
npm run db:seed
```
(Prefer raw SQL? Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor instead.)

### 4. Run
```bash
npm run dev
```
Open http://localhost:3000.

> **No Adzuna key?** The app automatically falls back to a built-in demo dataset, so job search
> works immediately. Add `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` later for live listings.

---

## 🔑 Environment variables & where to get keys

All variables live in `.env.example`. Summary of what you'll sign up for:

| Variable | Required? | Where to get it |
| --- | --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | **Yes** | Supabase → Project Settings → **Database** → Connection string. Use the **pooled** (port 6543, `?pgbouncer=true&connection_limit=1`) URL for `DATABASE_URL` and the **direct** (port 5432) URL for `DIRECT_URL`. https://supabase.com |
| `NEXTAUTH_SECRET` | **Yes** | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes (dev) | `http://localhost:3000` locally; your domain in prod (auto on Vercel) |
| `ANTHROPIC_API_KEY` | Yes for AI | https://console.anthropic.com → API Keys |
| `ANTHROPIC_MODEL` | Optional | Override the Claude model (defaults to a current Sonnet) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | One provider required | https://console.cloud.google.com/apis/credentials — OAuth client. Redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google` |
| `EMAIL_SERVER` / `EMAIL_FROM` | One provider required | Any SMTP service (Resend, Postmark, SendGrid, Mailgun…). Format: `smtp://user:pass@host:587` |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Optional | https://developer.adzuna.com — free API. Without it, the app uses demo data. |
| `ADZUNA_COUNTRY` | Optional | Country code: `us`, `gb`, `ca`, `au`, `de`, … (default `us`) |

You must configure **at least one** auth provider (Google *or* Email). If neither is set, the
sign-in page will tell you so.

---

## ▲ Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo. Framework auto-detects as Next.js.
3. Add all environment variables from your `.env` in **Project Settings → Environment Variables**.
   - Set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`) for custom
     domains. Add your production domain to Google's authorized redirect URIs too.
4. **Database**: point `DATABASE_URL`/`DIRECT_URL` at your Supabase project (same as local).
5. Deploy. The build runs `prisma generate && next build` (see `vercel.json`).
6. **Run migrations against production** once (from your machine, with prod `DIRECT_URL` set):
   ```bash
   npm run db:migrate    # or: npm run db:push
   ```

`vercel.json` bumps `maxDuration` to 60s for the AI generation and interview routes so longer
Claude calls don't time out. (Note: extended function durations require a Vercel plan that allows
them; the Hobby default is lower.)

---

## 🗄️ Database schema

Defined in `prisma/schema.prisma`. Core models:

- **User / Account / Session / VerificationToken** — NextAuth (Prisma adapter). `User` also holds
  profile fields (`headline`, `location`, `resumeText`, `resumeName`).
- **SavedJob** — a bookmarked listing, *snapshotted* so it survives even if the upstream posting
  disappears. Has a `PrepStatus` (NOT_STARTED / IN_PROGRESS / DONE).
- **PrepReport** — a generated report (summary, `assessmentType`, `topics[]`, `sampleQuestions[]`,
  full `markdown`), optionally linked to a `SavedJob`, with a `PrepReportStatus`.
- **InterviewMessage** — one turn of a mock-interview conversation attached to a report.
- **JobSearchCache** — server-side cache of external job-API responses for freshness + cost control.

Apply it with `npm run db:push` (fast, no migration history) or `prisma migrate dev` (versioned).
Raw SQL equivalent: `supabase/migrations/0001_init.sql`.

---

## 📁 Project structure

```
jobpilot/
├── prisma/
│   ├── schema.prisma          # data model
│   └── seed.ts                # optional demo seed
├── supabase/migrations/
│   └── 0001_init.sql          # raw SQL equivalent of the schema
├── src/
│   ├── app/
│   │   ├── layout.tsx         # root layout, fonts, providers
│   │   ├── page.tsx           # marketing landing page
│   │   ├── globals.css        # design tokens (light + dark)
│   │   ├── (auth)/signin/     # sign-in experience
│   │   ├── (app)/             # authed app shell (guarded)
│   │   │   ├── dashboard/     # saved jobs + stats
│   │   │   ├── jobs/          # job search + filters
│   │   │   ├── prep/          # prep list, new, and [id] (report + mock interview)
│   │   │   └── profile/       # profile + resume upload
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── jobs/search/
│   │       ├── saved-jobs/ (+ [id])
│   │       ├── prep/generate, prep/[id], prep/[id]/interview  # AI (interview streams)
│   │       ├── profile/
│   │       └── resume/
│   ├── components/            # UI primitives + feature components
│   ├── lib/
│   │   ├── auth.ts db.ts env.ts anthropic.ts prompts.ts
│   │   ├── rate-limit.ts validations.ts api.ts client.ts utils.ts
│   │   └── jobs/              # provider interface, adzuna + mock, normalize/dedupe/freshness
│   └── types/
├── .env.example
├── vercel.json
└── README.md
```

---

## 💸 Cost & rate-limit controls

- **Job search**: DB-backed cache (5-min TTL) + per-user rate limit (30/min).
- **Prep generation**: per-user limit (8/hour); each report is one bounded Claude call.
- **Mock interview**: per-user limit (60 turns/hour); streamed to keep latency low.

Limits live in `src/lib/rate-limit.ts` (`RATE_LIMITS`) — tune to your budget. The limiter is
in-memory (fine for single-region serverless); for multi-region scale, swap it for Upstash Redis
(`@upstash/ratelimit`) without changing call sites.

---

## 🧪 Scripts

```bash
npm run dev         # local dev
npm run build       # prisma generate && next build
npm run start       # run the production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run db:push     # push schema to the database
npm run db:migrate  # apply migrations (prod)
npm run db:studio   # Prisma Studio
npm run db:seed     # seed demo data
```

---

## 🔒 Notes on data & ethics

- Job data comes from **legitimate APIs** (Adzuna). No unofficial LinkedIn scraping.
- The AI prep **does not** scrape Glassdoor/Blind. It reasons from the job description and any
  public notes *you* paste, and is prompted to distinguish known facts from general expectations.
- Only the **parsed plain text** of an uploaded resume is stored — never the original file.

---

## 🛠️ Extending

- **Add a job provider**: implement `JobProvider` in `src/lib/jobs/` (see `mock-provider.ts`),
  and wire it into `getProvider()` in `src/lib/jobs/index.ts`.
- **Change the AI prompts**: edit `src/lib/prompts.ts`.
- **Restyle**: all design tokens are CSS variables in `src/app/globals.css` + `tailwind.config.ts`.

Happy shipping 🚀
