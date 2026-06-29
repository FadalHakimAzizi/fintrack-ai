import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  embed,
  transactionToText,
  embeddingsEnabled,
  EMBEDDINGS_PROVIDER_NAME,
} from "@/lib/embeddings";

// Embeds transactions that don't have a vector yet (existing rows, n8n/CSV
// imports, etc.). Processes a bounded batch per call so the client can loop
// until `remaining` hits 0.
const BATCH = 50;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (!embeddingsEnabled()) {
    return NextResponse.json({ error: "Embeddings dinonaktifkan (EMBEDDINGS_DISABLED=1)." }, { status: 400 });
  }

  // reset=true clears every existing vector first — required when switching
  // embedding providers (Qwen3 ↔ Voyage vectors aren't comparable).
  let reset = false;
  try {
    const body = await request.json();
    reset = Boolean(body?.reset);
  } catch {
    // no/invalid body → normal incremental backfill
  }

  if (reset) {
    const { error: clearErr } = await supabase
      .from("transactions")
      .update({ embedding: null })
      .eq("user_id", user.id)
      .not("embedding", "is", null);
    if (clearErr) return NextResponse.json({ error: clearErr.message }, { status: 500 });

    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);
    return NextResponse.json({ ok: true, reset: true, embedded: 0, remaining: count ?? 0, done: false });
  }

  const { data: rows, error } = await supabase
    .from("transactions")
    .select(
      "id, transaction_type, amount, currency, transaction_date, merchant_name, item_name, category, payment_method, notes",
    )
    .is("embedding", null)
    .order("transaction_date", { ascending: false })
    .limit(BATCH);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let embedded = 0;
  let failed = 0;
  for (const r of rows || []) {
    const vec = await embed(transactionToText(r));
    if (!vec) {
      failed++;
      continue;
    }
    const { error: upErr } = await supabase
      .from("transactions")
      .update({ embedding: vec })
      .eq("id", r.id);
    if (upErr) failed++;
    else embedded++;
  }

  // How many still need embedding after this batch?
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .is("embedding", null);

  const remaining = count ?? 0;

  // If we processed a full batch but embedded nothing, the embeddings provider
  // is failing — surface a provider-specific hint instead of looping forever.
  if ((rows?.length ?? 0) > 0 && embedded === 0) {
    const hint =
      EMBEDDINGS_PROVIDER_NAME === "ollama"
        ? "Pastikan Ollama berjalan dan model 'qwen3-embedding:0.6b' sudah di-pull."
        : `Provider embedding '${EMBEDDINGS_PROVIDER_NAME}' gagal merespons. Periksa EMBEDDINGS_API_KEY, EMBEDDINGS_BASE_URL, dan EMBEDDINGS_MODEL di environment.`;
    return NextResponse.json(
      { error: `Tidak ada yang berhasil di-embed. ${hint}`, remaining },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    embedded,
    failed,
    remaining,
    done: remaining === 0,
  });
}
