"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Berapa total pengeluaran bulan ini?",
  "Kategori pengeluaran mana yang paling besar?",
  "Bandingkan pengeluaran bulan ini vs bulan lalu",
  "Merchant apa yang paling sering saya pakai?",
  "Ada transaksi yang mencurigakan akhir-akhir ini?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed.error || text;
        } catch {}
        setError(msg || `Request failed (${res.status})`);
        setMessages(next);
        return;
      }

      const data = (await res.json()) as { content: string };
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    setMessages([]);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  }

  const showEmptyState = messages.length === 0 && !loading;

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto w-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
      >
        {showEmptyState ? (
          <EmptyState onPick={(s) => send(s)} suggestions={SUGGESTIONS} />
        ) : (
          messages.map((m, i) => <MessageBubble key={i} msg={m} />)
        )}
        {loading ? <TypingBubble /> : null}
        {error ? (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-outline-variant/50 bg-surface-container-lowest px-6 py-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Tanyakan apa saja tentang transaksi Anda..."
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-outline-variant rounded-lg text-body-md bg-surface-container-lowest text-on-surface focus-ring transition-all resize-none max-h-40"
              disabled={loading}
            />
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded"
                title="Clear conversation"
              >
                <Icon name="restart_alt" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="h-[50px] w-[50px] rounded-lg bg-primary text-on-primary grid place-items-center hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-40"
          >
            <Icon name={loading ? "hourglass_empty" : "send"} filled />
          </button>
        </div>
        <p className="text-label-caps text-outline mt-2 px-1">
          Enter to send · Shift+Enter for newline · Data scope: last 90 days, up to 500 transactions
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  suggestions,
}: {
  onPick: (s: string) => void;
  suggestions: string[];
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-container/10 text-primary grid place-items-center">
        <Icon name="smart_toy" filled />
      </div>
      <h3 className="text-h3 font-h3 text-on-surface mb-2">
        Halo! Saya asisten keuangan Anda.
      </h3>
      <p className="text-body-sm text-outline mb-8 max-w-md mx-auto">
        Saya bisa bantu menganalisa pola pengeluaran, membandingkan periode, dan menjawab
        pertanyaan tentang transaksi Anda.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left px-4 py-3 rounded-lg border border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low hover:border-primary/30 transition-colors text-body-sm text-on-surface"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "w-9 h-9 rounded-full grid place-items-center shrink-0",
          isUser
            ? "bg-primary-container text-on-primary"
            : "bg-secondary-container text-on-secondary-container",
        )}
      >
        <Icon name={isUser ? "person" : "smart_toy"} filled />
      </div>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-xl text-body-md whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-on-primary rounded-tr-sm"
            : "bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-tl-sm shadow-card",
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-secondary-container text-on-secondary-container">
        <Icon name="smart_toy" filled />
      </div>
      <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-container-lowest border border-outline-variant/30 shadow-card">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-outline animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-outline animate-bounce" />
        </div>
      </div>
    </div>
  );
}
