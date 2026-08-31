import { Skeleton } from "@/components/ui/skeleton";
import { JobGridSkeleton } from "@/components/jobs/job-card-skeleton";

export default function AppLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <JobGridSkeleton count={3} />
    </div>
  );
}
