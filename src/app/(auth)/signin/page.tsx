import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, configuredProviders } from "@/lib/auth";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; verify?: string; error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect(searchParams.callbackUrl || "/dashboard");

  return (
    <SignInForm
      providers={configuredProviders}
      callbackUrl={searchParams.callbackUrl || "/dashboard"}
      verify={searchParams.verify === "1"}
      error={searchParams.error}
    />
  );
}
