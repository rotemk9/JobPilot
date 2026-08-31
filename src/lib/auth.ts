import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import type { Adapter } from "next-auth/adapters";

import { db } from "@/lib/db";
import { env, features } from "@/lib/env";

// Build the providers list conditionally so the app boots even if only one
// (or neither) is configured. At least one should be set for real usage.
const providers: NextAuthOptions["providers"] = [];

if (features.google) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (features.email) {
  providers.push(
    EmailProvider({
      server: env.EMAIL_SERVER!,
      from: env.EMAIL_FROM!,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  secret: env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin?verify=1",
    error: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.headline = (user as { headline?: string | null }).headline ?? null;
        session.user.hasResume = Boolean((user as { resumeText?: string | null }).resumeText);
      }
      return session;
    },
  },
};

/** Server-side helper to read the current session. */
export function auth() {
  return getServerSession(authOptions);
}

/** Providers that are actually configured (used by the sign-in UI). */
export const configuredProviders = {
  google: features.google,
  email: features.email,
} as const;
