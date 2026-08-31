"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email is already linked to a different sign-in method. Use the original method.",
  Verification: "That sign-in link is invalid or has expired. Request a new one.",
  Default: "Something went wrong signing you in. Please try again.",
};

export function SignInForm({
  providers,
  callbackUrl,
  verify,
  error,
}: {
  providers: { google: boolean; email: boolean };
  callbackUrl: string;
  verify?: boolean;
  error?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState<"google" | "email" | null>(null);
  const [sent, setSent] = React.useState(false);

  const noProviders = !providers.google && !providers.email;

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading("email");
    const res = await signIn("email", { email, callbackUrl, redirect: false });
    setLoading(null);
    if (res?.ok) setSent(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[400px]"
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Welcome to JobPilot
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Find jobs and prep for interviews with AI.
        </p>
      </div>

      <Card className="border-border/80 bg-surface/80 backdrop-blur">
        <CardContent className="space-y-4 p-6">
          {(verify || sent) && (
            <div className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>Check your inbox for a secure sign-in link.</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>{ERROR_MESSAGES[error] || ERROR_MESSAGES.Default}</span>
            </div>
          )}

          {noProviders && (
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <span>
                No auth providers configured yet. Set <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code>{" "}
                or the <code className="font-mono text-xs">EMAIL_SERVER</code> env vars. See the README.
              </span>
            </div>
          )}

          {providers.google && (
            <Button
              variant="secondary"
              className="w-full"
              loading={loading === "google"}
              onClick={() => {
                setLoading("google");
                signIn("google", { callbackUrl });
              }}
            >
              <GoogleIcon /> Continue with Google
            </Button>
          )}

          {providers.google && providers.email && (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-2xs uppercase tracking-wider">
                <span className="bg-surface px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}

          {providers.email && !sent && (
            <form onSubmit={handleEmail} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" loading={loading === "email"}>
                <Mail className="h-4 w-4" /> Send magic link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms and acknowledge our Privacy Policy.
      </p>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
