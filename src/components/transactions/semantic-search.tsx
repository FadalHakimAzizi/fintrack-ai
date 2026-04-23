"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { TxRow } from "@/components/transactions/tx-row";
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
      <form onSubmit={onSubmit} className="relative">
        <div className="relative flex items-center">
          <Icon name="auto_awesome" className="absolute left-4 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='AI search: try "kopi bulan lalu" or "tagihan > 500rb"...'
            className={cn(
              "w-full pl-11 pr-24 py-3.5 border rounded-xl text-body-md focus-ring transition-all",
              "bg-surface-container-lowest text-on-surface placeholder:text-outline/60",
              results !== null ? "border-primary" : "border-outline-variant",
            )}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={onClear}
                className="w-8 h-8 rounded-full grid place-items-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <Icon name="close" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-body-sm font-medium disabled:opacity-40 transition-colors hover:bg-on-primary-fixed-variant"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {!results && !loading && !error && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="px-3 py-1.5 rounded-full border border-outline-variant text-body-sm text-on-surface-variant hover:bg-surface-container hover:border-primary hover:text-primary transition-colors"
            >
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
        <div className="py-8 text-center text-outline text-body-sm">
          <Icon name="auto_awesome" className="animate-pulse" />
          <span className="ml-2">AI is searching...</span>
        </div>
      )}

      {results !== null && !loading && (
        <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
            <span className="text-body-sm font-semibold text-on-surface">
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </span>
            <button onClick={onClear} className="text-body-sm text-primary hover:underline">
              Clear
            </button>
          </div>
          {results.length > 0 ? (
            <div className="space-y-1 p-2">
              {results.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-outline text-body-sm">
              No matching transactions found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
