"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="font-display text-lg font-semibold tracking-tight">Something went wrong</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        We hit an unexpected error loading this page. You can try again.
      </p>
      <Button onClick={reset} className="mt-6">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
