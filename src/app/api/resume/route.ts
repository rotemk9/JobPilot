import { handler, json, requireUser, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/resume — upload a resume (PDF or plain text/markdown) and store its
 * parsed plaintext for use in AI prompts. We only keep the extracted text.
 */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();

  const rl = rateLimit(`resume:${user.id}`, RATE_LIMITS.resume.limit, RATE_LIMITS.resume.windowMs);
  if (!rl.success) throw new ApiError(429, "Too many uploads. Try again shortly.", "RATE_LIMITED");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "No file uploaded.", "NO_FILE");
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "That file is larger than 5 MB.", "TOO_LARGE");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name || "resume";
  const isPdf = file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");

  let text = "";
  try {
    if (isPdf) {
      // Lazy-import so the (heavy, CJS) dependency isn't loaded unless needed.
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text || "";
    } else {
      text = buffer.toString("utf-8");
    }
  } catch (err) {
    console.error("[resume] parse error:", err);
    throw new ApiError(422, "Couldn't read that file. Try a text-based PDF or a .txt file.", "PARSE_FAILED");
  }

  text = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 30) {
    throw new ApiError(
      422,
      "We couldn't extract readable text — scanned/image PDFs aren't supported. Paste your resume as text instead.",
      "EMPTY_TEXT"
    );
  }
  // Cap stored length to keep prompts and rows reasonable.
  text = text.slice(0, 15000);

  await db.user.update({
    where: { id: user.id },
    data: { resumeText: text, resumeName: name },
  });

  return json({ ok: true, resumeName: name, chars: text.length });
});

/** DELETE /api/resume — remove the stored resume text. */
export const DELETE = handler(async () => {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { resumeText: null, resumeName: null } });
  return json({ ok: true });
});
