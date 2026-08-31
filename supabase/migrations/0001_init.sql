-- JobPilot initial schema (matches prisma/schema.prisma).
--
-- Preferred setup path is `npm run db:push` (or `prisma migrate`), which
-- generates and applies this for you. This file is provided for people who
-- want to run the SQL directly in the Supabase SQL editor.

-- ---------- Enums ----------
CREATE TYPE "PrepStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');
CREATE TYPE "PrepReportStatus" AS ENUM ('PENDING', 'READY', 'FAILED');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- ---------- NextAuth ----------
CREATE TABLE "User" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT UNIQUE,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "headline"      TEXT,
  "location"      TEXT,
  "resumeText"    TEXT,
  "resumeName"    TEXT
);

CREATE TABLE "Account" (
  "id"                 TEXT PRIMARY KEY,
  "userId"             TEXT NOT NULL,
  "type"               TEXT NOT NULL,
  "provider"           TEXT NOT NULL,
  "providerAccountId"  TEXT NOT NULL,
  "refresh_token"      TEXT,
  "access_token"       TEXT,
  "expires_at"         INTEGER,
  "token_type"         TEXT,
  "scope"              TEXT,
  "id_token"           TEXT,
  "session_state"      TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

CREATE TABLE "Session" (
  "id"           TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL,
  "expires"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- ---------- Domain ----------
CREATE TABLE "SavedJob" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "source"      TEXT NOT NULL,
  "sourceId"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "company"     TEXT NOT NULL,
  "location"    TEXT,
  "remote"      BOOLEAN NOT NULL DEFAULT false,
  "url"         TEXT,
  "description" TEXT NOT NULL,
  "salaryMin"   INTEGER,
  "salaryMax"   INTEGER,
  "currency"    TEXT DEFAULT 'USD',
  "seniority"   TEXT,
  "tags"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "postedAt"    TIMESTAMP(3),
  "status"      "PrepStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "SavedJob_userId_source_sourceId_key" ON "SavedJob"("userId", "source", "sourceId");
CREATE INDEX "SavedJob_userId_idx" ON "SavedJob"("userId");
CREATE INDEX "SavedJob_userId_status_idx" ON "SavedJob"("userId", "status");

CREATE TABLE "PrepReport" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL,
  "savedJobId"      TEXT,
  "company"         TEXT NOT NULL,
  "role"            TEXT NOT NULL,
  "jobDescription"  TEXT,
  "publicNotes"     TEXT,
  "status"          "PrepReportStatus" NOT NULL DEFAULT 'PENDING',
  "markdown"        TEXT,
  "summary"         TEXT,
  "assessmentType"  TEXT,
  "topics"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sampleQuestions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "error"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrepReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "PrepReport_savedJobId_fkey" FOREIGN KEY ("savedJobId") REFERENCES "SavedJob"("id") ON DELETE SET NULL
);
CREATE INDEX "PrepReport_userId_idx" ON "PrepReport"("userId");
CREATE INDEX "PrepReport_savedJobId_idx" ON "PrepReport"("savedJobId");

CREATE TABLE "InterviewMessage" (
  "id"           TEXT PRIMARY KEY,
  "prepReportId" TEXT NOT NULL,
  "role"         "MessageRole" NOT NULL,
  "content"      TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterviewMessage_prepReportId_fkey" FOREIGN KEY ("prepReportId") REFERENCES "PrepReport"("id") ON DELETE CASCADE
);
CREATE INDEX "InterviewMessage_prepReportId_idx" ON "InterviewMessage"("prepReportId");

CREATE TABLE "JobSearchCache" (
  "id"        TEXT PRIMARY KEY,
  "key"       TEXT NOT NULL UNIQUE,
  "payload"   JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "JobSearchCache_expiresAt_idx" ON "JobSearchCache"("expiresAt");
