/** Prompt templates for the Claude-powered prep features. */

export interface PrepPromptInput {
  company: string;
  role: string;
  jobDescription?: string | null;
  publicNotes?: string | null; // public info the user pasted (they gathered it, we don't scrape)
  resumeText?: string | null;
}

/**
 * We deliberately DON'T claim to have scraped Glassdoor/Blind. Instead we reason
 * from (a) the user-provided job description, (b) any public notes the user
 * pasted, and (c) general, well-known patterns for this type of company/role.
 * The model is told to be explicit about uncertainty.
 */
export function prepReportSystemPrompt(): string {
  return `You are JobPilot's interview-prep strategist. You help a candidate prepare for a specific company's interview and assessment process.

Ground rules:
- Base your analysis on: the job description provided, any public notes the candidate pasted, and widely-known, general patterns about this kind of company and role. You do NOT have live access to Glassdoor, Blind, or the company's internal process.
- Be explicit about confidence. When something is a general expectation rather than a known fact about this company, say so ("Companies of this type typically…").
- Never fabricate specific, verifiable claims (e.g. "Their round 2 is always a 45-minute React live-coding") unless it appears in the candidate's pasted notes. Prefer calibrated language.
- Be concrete, practical, and encouraging. Optimize for what the candidate should actually do this week.

You will return a SINGLE JSON object and nothing else.`;
}

export function prepReportUserPrompt(input: PrepPromptInput): string {
  const parts: string[] = [];
  parts.push(`Company: ${input.company}`);
  parts.push(`Role: ${input.role}`);
  if (input.jobDescription?.trim()) {
    parts.push(`\nJob description (provided by candidate):\n"""\n${clip(input.jobDescription, 6000)}\n"""`);
  }
  if (input.publicNotes?.trim()) {
    parts.push(`\nPublic notes the candidate gathered (e.g. Glassdoor/Blind snippets, recruiter emails):\n"""\n${clip(input.publicNotes, 4000)}\n"""`);
  }
  if (input.resumeText?.trim()) {
    parts.push(`\nCandidate resume (plain text, tailor advice to their background):\n"""\n${clip(input.resumeText, 5000)}\n"""`);
  }

  parts.push(`
Produce a tailored interview & assessment prep report.

Return ONLY a JSON object with exactly these keys:
{
  "summary": string,              // 2-3 sentence overview of what to expect and where to focus
  "assessmentType": string,       // the single most likely primary assessment format, e.g. "Coding (data structures & algorithms)", "System design", "Case study", "Behavioral", "Take-home", "Mixed technical + behavioral"
  "topics": string[],             // 5-9 concrete topics/skills to review, most important first
  "sampleQuestions": string[],    // 6-10 realistic practice questions tailored to this role & company type
  "markdown": string              // the full report in rich Markdown (see structure below)
}

The "markdown" field must be a complete, well-structured report using this outline:
## Interview process overview
(what stages this kind of company typically runs; note confidence)
## Likely assessment format
(the primary format and why, plus secondary formats)
## What to review
(prioritized topics with a one-line "why it matters" each)
## Practice questions
(a numbered list of the sample questions, grouped by type where useful)
## How to prepare this week
(a concrete day-by-day or checklist plan)
## Red flags & tips
(common mistakes for this role and how to stand out)

Keep the markdown mobile-friendly: short paragraphs, clear headers, bulleted lists. Do not include the JSON keys inside the markdown. Output must be valid JSON (escape newlines inside strings).`);

  return parts.join("\n");
}

/** System prompt for the live mock-interview mode. */
export function mockInterviewSystemPrompt(ctx: {
  company: string;
  role: string;
  assessmentType?: string | null;
  reportSummary?: string | null;
}): string {
  return `You are conducting a realistic but supportive mock interview for the role of "${ctx.role}" at "${ctx.company}".
${ctx.assessmentType ? `The primary assessment format is: ${ctx.assessmentType}.` : ""}
${ctx.reportSummary ? `Context from the candidate's prep report: ${clip(ctx.reportSummary, 800)}` : ""}

How to run the session:
- Ask ONE question at a time. Wait for the candidate's answer before moving on.
- After each answer, give brief, specific feedback: what was strong, what to improve, and (if relevant) a stronger way to frame it. Then ask a natural follow-up or the next question.
- Calibrate difficulty to their answers. Stay in character as a friendly interviewer.
- Keep each of your turns concise (a few short paragraphs at most). Use Markdown for structure when helpful.
- If the candidate asks for a hint or to move on, oblige.
- Open the session (your first message) with a short, warm framing of what you'll cover, then ask your first question.`;
}

function clip(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
