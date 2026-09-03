import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import type { Adapter } from "next-auth/adapters";

import { db } from "@/lib/db";
import { env, features } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "credentials",
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;
      if (!email || !password) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !user.password) return null;
      if (!verifyPassword(password, user.password)) return null;
      return { id: user.id, name: user.name, email: user.email, image: user.image };
    },
  }),
];

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
  providers.push(EmailProvider({ server: env.EMAIL_SERVER!, from: env.EMAIL_FROM! }));
}

// The Prisma adapter is only needed for OAuth / email-link providers. With pure
// credentials + JWT we skip it (avoids adapter/credentials edge cases).
const useAdapter = features.google || features.email;

export const authOptions: NextAuthOptions = {
  ...(useAdapter ? { adapter: PrismaAdapter(db) as Adapter } : {}),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: env.NEXTAUTH_SECRET,
  providers,
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin?verify=1",
    error: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? (token.sub as string);
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export const configuredProviders = {
  credentials: true,
  google: features.google,
  email: features.email,
} as const;
