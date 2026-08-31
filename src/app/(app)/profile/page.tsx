import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { ResumeUpload } from "@/components/profile/resume-upload";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, headline: true, location: true, resumeName: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="Manage your details and resume." />
      <div className="space-y-5">
        <ProfileForm
          email={user?.email}
          initial={{
            name: user?.name ?? "",
            headline: user?.headline ?? "",
            location: user?.location ?? "",
          }}
        />
        <ResumeUpload resumeName={user?.resumeName ?? null} />
      </div>
    </div>
  );
}
