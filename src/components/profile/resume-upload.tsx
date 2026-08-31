"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function ResumeUpload({ resumeName }: { resumeName: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/resume", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      toast({ variant: "success", title: "Resume uploaded", description: file.name });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setUploading(true);
    try {
      await fetch("/api/resume", { method: "DELETE" });
      toast({ title: "Resume removed" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Couldn't remove resume" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>
          Optional. We parse it to plain text and use it to tailor your prep reports. Only the text is stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resumeName ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/50 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{resumeName}</p>
                <p className="text-xs text-muted-foreground">Parsed and ready for prompts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} loading={uploading}>
                Replace
              </Button>
              <Button variant="ghost" size="icon" onClick={remove} disabled={uploading} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) upload(file);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 hover:bg-surface-muted/40"
            )}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            </div>
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drop your resume or click to upload"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF or .txt · up to 5 MB · text-based PDFs only</p>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />

        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Scanned/image PDFs can&apos;t be read — paste as text if needed.
        </p>
      </CardContent>
    </Card>
  );
}
