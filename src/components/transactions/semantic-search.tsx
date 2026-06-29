"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { TxRow } from "@/components/transactions/tx-row";
import { SkeletonRows } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const SUGGESTIONS = [
  "kopi bulan lalu",
  "makan siang minggu ini",
  "tagihan lebih dari 500rb",
  "belanja di indomaret",
  "transportasi kemarin",
];

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Search failed"); }
      else { setResults(data.results || []); }
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  function onSuggestion(s: string) {
    setQuery(s);
    doSearch(s);
    inputRef.current?.focus();
  }

  function onClear() {
    setQuery("");
    setResults(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit}>
        <div
          className={cn(
            "group relative flex items-center rounded-xl border bg-surface-container-lowest shadow-xs transition-all duration-200",
            "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15",
            results !== null ? "border-primary/60" : "border-outline-variant",
          )}
        >
          <Icon
            name="auto_awesome"
            filled
            className="absolute left-4 text-primary transition-transform group-focus-within:scale-110"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Coba "kopi bulan lalu" atau "tagihan > 500rb"…'
            className="w-full bg-transparent py-3.5 pl-12 pr-28 text-body-md text-on-surface outline-none placeholder:text-outline/60"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Bersihkan pencarian"
                className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Icon name="close" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-on-primary-fixed-variant px-4 py-2 text-body-sm font-semibold text-on-primary shadow-xs transition-all duration-200 hover:shadow-card disabled:opacity-40 disabled:shadow-none"
            >
              <Icon name={loading ? "hourglass_top" : "search"} className={cn(loading && "animate-spin")} />
              {loading ? "Mencari…" : "Cari"}
            </button>
          </div>
        </div>
      </form>

      {!results && !loading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-on-surface-variant">Saran:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              <Icon name="bolt" className="text-[16px]" />
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
          <Icon name="error" />
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-outline-variant/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Icon name="auto_awesome" className="animate-pulse text-primary" />
            <span>AI sedang mencari…</span>
          </div>
          <SkeletonRows rows={4} />
        </div>
      )}

      {results !== null && !loading && (
        <div className="overflow-hidden rounded-xl border border-primary/20">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 bg-primary/[0.06] px-4 py-2.5">
            <span className="flex items-center gap-2 text-body-sm font-semibold text-on-surface">
              <Icon name="auto_awesome" filled className="text-primary" />
              {results.length} hasil untuk{" "}
              <span className="text-primary">&ldquo;{query}&rdquo;</span>
            </span>
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
            >
              <Icon name="close" className="text-[18px]" />
              Bersihkan
            </button>
          </div>
          {results.length > 0 ? (
            <div className="space-y-1 p-2">
              {results.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Icon name="search_off" className="text-outline" />
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Tidak ada transaksi yang cocok.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
