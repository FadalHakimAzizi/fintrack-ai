import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groqChat, GROQ_TEXT_MODEL } from "@/lib/groq";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let body: { query: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sinceDate = sixMonthsAgo.toISOString().slice(0, 10);

  const { data: txRows } = await supabase
    .from("transactions")
    .select("id, transaction_date, transaction_type, amount, currency, merchant_name, item_name, category, payment_method, notes")
    .gte("transaction_date", sinceDate)
    .order("transaction_date", { ascending: false })
    .limit(500);

  const compact = (txRows || []).map((t) => ({
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
  }));

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
${JSON.stringify(compact)}`;

  // Groq with automatic primary -> backup key fallback on rate/credit limits.
  const result = await groqChat({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    temperature: 0.1,
    maxTokens: 500,
  });

  if (!result.ok) {
    const msg =
      result.status === 429
        ? "Batas permintaan model AI tercapai. Coba lagi sebentar."
        : "Layanan AI sedang bermasalah. Coba lagi sebentar.";
    return NextResponse.json({ error: msg, detail: result.error }, { status: 502 });
  }

  const content = result.content || "[]";

  let ids: string[] = [];
  try {
    const cleaned = content.trim().replace(/```json?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === "string");
  } catch {
    // fallback: extract all UUIDs from the response
    ids = [...content.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].map((m) => m[0]);
  }

  if (ids.length === 0) return NextResponse.json({ results: [], total: 0 });

  // Fetch full transaction data for matched IDs
  const { data: results } = await supabase
    .from("transactions")
    .select("*")
    .in("id", ids.slice(0, 50))
    .order("transaction_date", { ascending: false });

  return NextResponse.json({ results: results || [], total: (results || []).length });
}
