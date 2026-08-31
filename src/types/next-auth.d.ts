import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      headline?: string | null;
      hasResume?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    headline?: string | null;
    resumeText?: string | null;
  }
}
