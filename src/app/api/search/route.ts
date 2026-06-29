import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed, embeddingsEnabled, EMBEDDING_MATCH_FLOOR } from "@/lib/embeddings";

// Semantic transaction search.
//
// Primary path is RAG: embed the query and retrieve the most similar
// transactions from across the user's ENTIRE history via the pgvector
// `match_transactions` RPC — no 6-month window, no per-search LLM cost.
// Falls back to a plain ILIKE text search when embeddings are unavailable or
// nothing clears the similarity floor (e.g. rows not embedded yet).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let body: { query: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  // ── RAG path ──
  if (embeddingsEnabled()) {
    const qvec = await embed(query, { query: true });
    if (qvec) {
      const { data: matches, error } = await supabase.rpc("match_transactions", {
        query_embedding: qvec,
        match_count: 40,
        match_threshold: EMBEDDING_MATCH_FLOOR,
      });
      if (!error && Array.isArray(matches) && matches.length > 0) {
        // matches arrive most-similar first; fetch full rows and preserve order.
        const ids = matches.map((m: { id: string }) => m.id);
        const { data: rows } = await supabase
          .from("transactions")
          .select("*")
          .in("id", ids);
        const byId = new Map((rows || []).map((r) => [r.id, r]));
        const results = ids.map((id) => byId.get(id)).filter(Boolean);
        return NextResponse.json({ results, total: results.length, mode: "rag" });
      }
    }
  }

  // ── Fallback: lexical search (no LLM cost) ──
  const e = query.replace(/[%,]/g, "");
  const { data: rows } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `merchant_name.ilike.%${e}%,item_name.ilike.%${e}%,notes.ilike.%${e}%,category.ilike.%${e}%`,
    )
    .order("transaction_date", { ascending: false })
    .limit(50);

  return NextResponse.json({ results: rows || [], total: (rows || []).length, mode: "text" });
}
