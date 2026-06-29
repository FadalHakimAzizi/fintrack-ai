import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqChat, GROQ_TEXT_MODEL } from "@/lib/groq";
import { embed, embeddingsEnabled, EMBEDDING_MATCH_FLOOR } from "@/lib/embeddings";

// Semantic transaction search — hybrid retrieval:
//  1. RAG: embed the query and pull semantically similar rows from across the
//     user's ENTIRE history via the pgvector match_transactions RPC (so old
//     transactions, beyond the recent window, are searchable).
//  2. Merge those candidates with a recent window for baseline coverage.
//  3. Let the LLM pick the matching IDs — it understands natural language,
//     dates ("bulan lalu") and amounts ("> 500rb"), which pure vector search
//     can't. This keeps the original (working) behaviour and adds RAG breadth.

const FIELDS =
  "id, transaction_date, transaction_type, amount, currency, merchant_name, item_name, category, payment_method, notes";

type Row = Record<string, unknown> & { id: string };

function compact(t: Row) {
  return {
    id: t.id,
    d: t.transaction_date,
    t: t.transaction_type === "income" ? "in" : "out",
    a: Number(t.amount),
    cur: t.currency,
    m: t.merchant_name || null,
    i: t.item_name || null,
    cat: t.category || null,
    pay: t.payment_method || null,
    n: t.notes || null,
  };
}

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

  // 1. RAG candidates across all history (low threshold → recall; the LLM filters).
  const ragRows: Row[] = [];
  if (embeddingsEnabled()) {
    const qvec = await embed(query, { query: true });
    if (qvec) {
      const { data: matches } = await supabase.rpc("match_transactions", {
        query_embedding: qvec,
        match_count: 40,
        match_threshold: Math.min(EMBEDDING_MATCH_FLOOR, 0.4),
      });
      if (Array.isArray(matches)) ragRows.push(...(matches as Row[]));
    }
  }

  // 2. Recent window for baseline coverage.
  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  const { data: recent } = await supabase
    .from("transactions")
    .select(FIELDS)
    .gte("transaction_date", since.toISOString().slice(0, 10))
    .order("transaction_date", { ascending: false })
    .limit(500);

  // 3. Merge + dedupe (RAG first so older relevant rows survive the cap).
  const seen = new Set<string>();
  const pool: Row[] = [];
  for (const r of [...ragRows, ...((recent as Row[]) || [])]) {
    if (!r?.id || seen.has(r.id)) continue;
    seen.add(r.id);
    pool.push(r);
    if (pool.length >= 500) break;
  }
  if (pool.length === 0) return NextResponse.json({ results: [], total: 0 });

  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = `You are a transaction search engine. Given a user's natural language query and a list of transactions, return ONLY the IDs of transactions that match the query.

Today: ${today}
Field legend: id, d=date, t=in/out, a=amount, cur=currency, m=merchant, i=item, cat=category, pay=payment_method, n=notes

Rules:
- Return ONLY a JSON array of matching transaction IDs: ["id1","id2",...]
- If nothing matches, return: []
- Match semantically: "kopi" matches merchants like "Starbucks", "Kopi Kenangan", items like "Americano", "Latte"
- "makan" or "food" matches Dining, Groceries, restaurant merchants
- Date queries: "bulan lalu" = last month, "minggu ini" = this week, "kemarin" = yesterday
- "lebih dari 100rb" means amount > 100000
- Return at most 50 IDs
- DO NOT return any explanation, only the JSON array

Transactions:
${JSON.stringify(pool.map(compact))}`;

  const result = await groqChat({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.1,
    maxTokens: 500,
  });

  let ids: string[] = [];
  if (result.ok) {
    const content = result.content || "[]";
    try {
      const cleaned = content.trim().replace(/```json?|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === "string");
    } catch {
      ids = [...content.matchAll(/[0-9a-f-]{36}/gi)].map((m) => m[0]);
    }
  } else {
    // LLM unavailable — fall back to a lexical filter over the candidate pool.
    const e = query.toLowerCase();
    ids = pool
      .filter((r) =>
        `${r.merchant_name ?? ""} ${r.item_name ?? ""} ${r.category ?? ""} ${r.notes ?? ""}`
          .toLowerCase()
          .includes(e),
      )
      .map((r) => r.id);
  }

  if (ids.length === 0) return NextResponse.json({ results: [], total: 0 });

  const { data: results } = await supabase
    .from("transactions")
    .select("*")
    .in("id", ids.slice(0, 50))
    .order("transaction_date", { ascending: false });

  return NextResponse.json({ results: results || [], total: (results || []).length });
}
