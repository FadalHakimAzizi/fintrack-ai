// Embeddings provider abstraction for RAG.
//
// Default = local Ollama running Qwen3-Embedding-0.6B (free, private, 1024 dims).
// For production (e.g. Vercel, which can't reach your localhost Ollama) switch
// to an OpenAI-compatible cloud provider that ALSO returns 1024-dim vectors so
// the pgvector schema stays identical — Voyage `voyage-3.5-lite` or Jina v3.
//
// Config (all optional — defaults target a local Ollama):
//   EMBEDDINGS_PROVIDER          ollama | openai | voyage | jina   (default ollama)
//   EMBEDDINGS_BASE_URL          ollama: http://localhost:11434
//                                cloud:  https://api.voyageai.com/v1 | https://api.jina.ai/v1 | https://api.openai.com/v1
//   EMBEDDINGS_MODEL             ollama: qwen3-embedding:0.6b | cloud: voyage-3.5-lite | jina-embeddings-v3 | text-embedding-3-small
//   EMBEDDINGS_API_KEY           required for cloud providers
//   EMBEDDINGS_DIM               default 1024 (must match the pgvector column)
//   EMBEDDINGS_MATCH_THRESHOLD   default 0.4  (min cosine similarity to count as "relevant")
//   EMBEDDINGS_DISABLED          set to 1 to turn RAG off (chat still works)

import type { SupabaseClient } from "@supabase/supabase-js";

const PROVIDER = (process.env.EMBEDDINGS_PROVIDER || "ollama").toLowerCase();
const BASE_URL = (process.env.EMBEDDINGS_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
const API_KEY = process.env.EMBEDDINGS_API_KEY || "";
const MODEL =
  process.env.EMBEDDINGS_MODEL || (PROVIDER === "ollama" ? "qwen3-embedding:0.6b" : "");

export const EMBEDDING_DIM = Number(process.env.EMBEDDINGS_DIM || 1024);

// Retrieval is GAP-based, not a flat threshold. Calibration (Qwen3-0.6B) showed
// transaction embeddings cluster tightly, so absolute cosine values are
// unreliable — but a genuine look-up makes its top hit stand out:
//   "iBox"          -> 0.69 vs next 0.48   (clear winner)
//   "transportasi"  -> 0.64 vs next 0.53   (clear winner)
//   "ringkas/tips"  -> ~0.44 flat          (nothing actually relevant)
// So: only retrieve when the BEST hit clears MATCH_THRESHOLD, then keep rows
// within REL_MARGIN of that best (the standouts), capped at MAX_MATCHES.
// FLOOR just trims the candidate pool the DB returns.
export const EMBEDDING_MATCH_FLOOR = Number(process.env.EMBEDDINGS_MATCH_FLOOR || 0.45);
export const EMBEDDING_MATCH_THRESHOLD = Number(process.env.EMBEDDINGS_MATCH_THRESHOLD || 0.58);
export const EMBEDDING_REL_MARGIN = Number(process.env.EMBEDDINGS_REL_MARGIN || 0.1);
export const EMBEDDING_MAX_MATCHES = Number(process.env.EMBEDDINGS_MAX_MATCHES || 6);

export function embeddingsEnabled(): boolean {
  return process.env.EMBEDDINGS_DISABLED !== "1";
}

export interface TxTextFields {
  transaction_type: string;
  amount: number | string | null | undefined;
  currency: string | null | undefined;
  transaction_date: string | null | undefined;
  merchant_name: string | null | undefined;
  item_name: string | null | undefined;
  category: string | null | undefined;
  payment_method: string | null | undefined;
  notes: string | null | undefined;
}

/** Compact natural-language document for a transaction, used as the embedding input. */
export function transactionToText(t: TxTextFields): string {
  const amt = t.amount != null ? Math.round(Number(t.amount)) : null;
  const parts = [
    t.transaction_type === "income" ? "Pemasukan" : "Pengeluaran",
    t.merchant_name,
    t.item_name,
    t.category,
    t.payment_method,
    t.notes,
    t.transaction_date,
    amt != null ? `${t.currency || "IDR"} ${amt}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/**
 * Embed text. Returns null on any failure so callers degrade gracefully (RAG
 * turns off rather than breaking the request).
 */
export async function embed(
  text: string,
  opts?: { query?: boolean },
): Promise<number[] | null> {
  if (!embeddingsEnabled() || !text?.trim()) return null;
  try {
    return PROVIDER === "ollama"
      ? await embedOllama(text, Boolean(opts?.query))
      : await embedOpenAICompatible(text, Boolean(opts?.query));
  } catch {
    return null;
  }
}

// ── Ollama (Qwen3): queries get an instruction prefix; documents stay raw ──
async function embedOllama(text: string, isQuery: boolean): Promise<number[] | null> {
  const input = isQuery
    ? `Instruct: Diberikan pertanyaan, ambil transaksi keuangan yang relevan.\nQuery: ${text}`
    : text;
  const res = await fetch(`${BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { embeddings?: number[][]; embedding?: number[] };
  const vec = json.embeddings?.[0] ?? json.embedding;
  return Array.isArray(vec) && vec.length ? vec : null;
}

// ── OpenAI-compatible (OpenAI / Voyage / Jina). Voyage & Jina use their own
//    query/document asymmetry fields instead of an instruction prefix. ──
async function embedOpenAICompatible(
  text: string,
  isQuery: boolean,
): Promise<number[] | null> {
  const body: Record<string, unknown> = { model: MODEL, input: [text] };
  // Lock the output to EMBEDDING_DIM so it matches the pgvector column, and use
  // each provider's query/document asymmetry field for better retrieval.
  if (PROVIDER === "voyage") {
    body.input_type = isQuery ? "query" : "document";
    body.output_dimension = EMBEDDING_DIM;
  } else if (PROVIDER === "jina") {
    body.task = isQuery ? "retrieval.query" : "retrieval.passage";
    body.dimensions = EMBEDDING_DIM;
  } else {
    body.dimensions = EMBEDDING_DIM; // OpenAI text-embedding-3-*
  }

  // Retry briefly on 429 (rate limit) so an occasional throttle doesn't drop a
  // row. Kept short so a chat query isn't delayed much.
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
      const vec = json.data?.[0]?.embedding;
      return Array.isArray(vec) && vec.length ? vec : null;
    }
    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    return null;
  }
  return null;
}

/** Embed a transaction and persist the vector. Best-effort; never throws. */
export async function embedAndStoreTransaction(
  supabase: SupabaseClient,
  txId: string,
  tx: TxTextFields,
): Promise<void> {
  try {
    const vec = await embed(transactionToText(tx));
    if (!vec) return;
    await supabase.from("transactions").update({ embedding: vec }).eq("id", txId);
  } catch {
    // ignore — embedding is an enhancement, not a hard requirement
  }
}
