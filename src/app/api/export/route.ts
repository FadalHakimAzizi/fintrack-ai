import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/utils";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);

  let q = supabase
    .from("transactions")
    .select(
      "transaction_date, transaction_type, merchant_name, item_name, category, amount, currency, payment_method, account_name, source_channel, notes, invoice_number, location, tags, confidence_score",
    )
    .order("transaction_date", { ascending: false });

  const type = searchParams.get("type");
  if (type === "income" || type === "expense") q = q.eq("transaction_type", type);
  const source = searchParams.get("source");
  if (source) q = q.eq("source_channel", source);
  const category = searchParams.get("category");
  if (category) q = q.eq("category", category);
  const from = searchParams.get("from");
  if (from) q = q.gte("transaction_date", from);
  const to = searchParams.get("to");
  if (to) q = q.lte("transaction_date", to);
  const qtext = searchParams.get("q");
  if (qtext) {
    const e = qtext.replace(/[%,]/g, "");
    q = q.or(`merchant_name.ilike.%${e}%,item_name.ilike.%${e}%,notes.ilike.%${e}%`);
  }

  const { data, error } = await q;
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data || []).map((r) => ({
    ...r,
    tags: Array.isArray(r.tags) ? r.tags.join("|") : "",
  }));
  const csv = toCSV(rows);
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${today}.csv"`,
    },
  });
}
