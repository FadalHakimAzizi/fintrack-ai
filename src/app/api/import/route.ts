import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RowSchema = z.object({
  transaction_type: z.enum(["income", "expense"]),
  transaction_date: z.string().min(1),
  amount: z.coerce.number().min(0),
  merchant_name: z.string().optional().nullable(),
  item_name: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  account_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  currency: z.string().default("IDR"),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let body: { rows: unknown[] };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const toInsert: object[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.rows.length; i++) {
    const parsed = RowSchema.safeParse(body.rows[i]);
    if (!parsed.success) {
      errors.push(`Row ${i + 1}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const v = parsed.data;
    toInsert.push({
      user_id: user.id,
      transaction_type: v.transaction_type,
      transaction_date: v.transaction_date,
      amount: v.amount,
      merchant_name: v.merchant_name || null,
      item_name: v.item_name || null,
      category: v.category || null,
      payment_method: v.payment_method || null,
      account_name: v.account_name || null,
      notes: v.notes || null,
      currency: v.currency || "IDR",
      source_channel: "api",
      parsed_status: "reviewed",
      reviewed_by_user: true,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ error: "No valid rows", errors }, { status: 400 });
  }

  const { error } = await supabase.from("transactions").insert(toInsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: toInsert.length, errors });
}
