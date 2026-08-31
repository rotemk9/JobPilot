import { auth } from "@/lib/auth";
import { Landing } from "@/components/marketing/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  return <Landing authed={Boolean(session?.user)} />;
}
