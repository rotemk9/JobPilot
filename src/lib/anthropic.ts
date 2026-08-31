import Anthropic from "@anthropic-ai/sdk";
import { env, features } from "@/lib/env";
import {
  prepReportSystemPrompt,
  prepReportUserPrompt,
  mockInterviewSystemPrompt,
  type PrepPromptInput,
} from "@/lib/prompts";

let client: Anthropic | null = null;

/** Lazily construct a shared Anthropic client. Throws if no key configured. */
export function getAnthropic(): Anthropic {
  if (!features.anthropic) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment to enable AI prep features."
    );
  }
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });
  return client;
}

export interface GeneratedPrepReport {
  summary: string;
  assessmentType: string;
  topics: string[];
  sampleQuestions: string[];
  markdown: string;
}

/** Generate a structured prep report. Parses the model's JSON with a fallback. */
export async function generatePrepReport(
  input: PrepPromptInput
): Promise<GeneratedPrepReport> {
  const anthropic = getAnthropic();

  const message = await anthropic.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    temperature: 0.4,
    system: prepReportSystemPrompt(),
    messages: [{ role: "user", content: prepReportUserPrompt(input) }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return parseReport(text);
}

function parseReport(text: string): GeneratedPrepReport {
  const jsonStr = extractJson(text);
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return {
        summary: str(parsed.summary),
        assessmentType: str(parsed.assessmentType) || "Mixed technical + behavioral",
        topics: arr(parsed.topics),
        sampleQuestions: arr(parsed.sampleQuestions),
        markdown: str(parsed.markdown) || text,
      };
    } catch {
      // fall through to plaintext fallback
    }
  }
  // Fallback: treat the whole response as the markdown report.
  return {
    summary: "",
    assessmentType: "Mixed technical + behavioral",
    topics: [],
    sampleQuestions: [],
    markdown: text,
  };
}

/** Pull the first balanced JSON object out of a string (handles code fences). */
function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 12) : [];
}

export interface InterviewContext {
  company: string;
  role: string;
  assessmentType?: string | null;
  reportSummary?: string | null;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Stream a mock-interview turn. Returns a web ReadableStream of UTF-8 text
 * chunks suitable for returning directly from a route handler.
 */
export async function streamInterviewTurn(
  ctx: InterviewContext,
  history: ChatTurn[],
  onFinish?: (fullText: string) => Promise<void> | void
): Promise<ReadableStream<Uint8Array>> {
  const anthropic = getAnthropic();
  const encoder = new TextEncoder();

  // Ensure the conversation starts with a user turn for the API.
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));
  if (messages.length === 0 || messages[0].role !== "user") {
    messages.unshift({ role: "user", content: "Let's begin the mock interview." });
  }

  const stream = anthropic.messages.stream({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1500,
    temperature: 0.7,
    system: mockInterviewSystemPrompt(ctx),
    messages,
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode("\n\n_[The interviewer lost their train of thought — please try again.]_")
        );
        console.error("[interview] stream error:", err);
      } finally {
        controller.close();
        if (full.trim() && onFinish) {
          try {
            await onFinish(full);
          } catch (e) {
            console.error("[interview] onFinish error:", e);
          }
        }
      }
    },
  });
}
