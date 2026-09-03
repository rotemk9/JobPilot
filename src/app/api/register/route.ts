import { handler, json, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const POST = handler(async (req: Request) => {
  const { name, email, password } = schema.parse(await req.json());
  const normalized = email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists. Try signing in.", "EXISTS");
  }

  const user = await db.user.create({
    data: { name: name.trim(), email: normalized, password: hashPassword(password) },
    select: { id: true },
  });

  return json({ ok: true, userId: user.id }, { status: 201 });
});
