import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

/** Thrown by guards to short-circuit a route handler with a specific response. */
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Ensure a signed-in user; returns the session user or throws ApiError(401). */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "You must be signed in.", "UNAUTHENTICATED");
  }
  return session.user;
}

/**
 * Wrap a route handler with consistent error handling so every failure returns
 * a clean JSON envelope instead of an unhandled 500 / HTML error page.
 */
export function handler<T extends (...args: any[]) => Promise<Response>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: err.status }
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Invalid request.", code: "VALIDATION", issues: err.flatten() },
          { status: 422 }
        );
      }
      console.error("[api] unhandled error:", err);
      return NextResponse.json(
        { error: "Something went wrong. Please try again.", code: "INTERNAL" },
        { status: 500 }
      );
    }
  }) as T;
}
