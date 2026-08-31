"use client";

import * as React from "react";
import { Send, Bot, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { cn, initials } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean };

export function MockInterview({
  reportId,
  initialMessages,
  candidateName,
}: {
  reportId: string;
  initialMessages: Msg[];
  candidateName?: string | null;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const started = messages.length > 0;

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function send(message?: string) {
    if (sending) return;
    setSending(true);

    if (message) setMessages((m) => [...m, { role: "user", content: message }]);
    setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);
    setInput("");

    try {
      const res = await fetch(`/api/prep/${reportId}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed." }));
        throw new Error(err.error || "Request failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: acc, streaming: true };
          return next;
        });
      }
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "assistant", content: acc || "…", streaming: false };
        return next;
      });
    } catch (err) {
      // Drop the empty assistant placeholder and surface the error.
      setMessages((m) => m.filter((msg, i) => !(i === m.length - 1 && msg.streaming)));
      toast({
        variant: "destructive",
        title: "Interview paused",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    send(value);
  }

  return (
    <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-xl border border-border bg-surface/40">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        {!started ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              className="border-0 bg-transparent"
              icon={<Bot className="h-6 w-6" />}
              title="Ready for a mock interview?"
              description="Claude plays a friendly interviewer for this exact role — asking questions, reacting to your answers, and giving feedback as you go."
              action={
                <Button onClick={() => send()} loading={sending}>
                  <Sparkles className="h-4 w-4" /> Start mock interview
                </Button>
              }
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    m.role === "assistant"
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-strong text-foreground"
                  )}
                >
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : initials(candidateName, "You")}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[75%]",
                    m.role === "assistant"
                      ? "rounded-tl-sm bg-surface"
                      : "rounded-tr-sm bg-accent text-accent-foreground"
                  )}
                >
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown className="text-[14px]">{m.content}</Markdown>
                    ) : (
                      <TypingDots />
                    )
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  )}
                  {m.streaming && m.content && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-accent align-middle" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Composer */}
      {started && (
        <form onSubmit={onSubmit} className="border-t border-border bg-surface/60 p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              placeholder="Type your answer…  (Enter to send, Shift+Enter for a new line)"
              className="max-h-40 min-h-[48px] flex-1 resize-none"
              disabled={sending}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" loading={sending} aria-label="Send">
              {!sending && <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-2 flex justify-between px-1">
            <p className="text-2xs text-muted-foreground">Claude reacts to each answer and adapts the next question.</p>
            <button
              type="button"
              onClick={() => send("Can you give me a hint?")}
              disabled={sending}
              className="inline-flex items-center gap-1 text-2xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" /> Ask for a hint
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
