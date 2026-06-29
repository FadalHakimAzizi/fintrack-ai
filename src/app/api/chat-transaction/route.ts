import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { embedAndStoreTransaction } from "@/lib/embeddings";

const ChatTransactionSchema = z.object({
  transaction_type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  currency: z.string().default("IDR"),
  transaction_date: z.string().optional().nullable(),
  merchant_name: z.string().nullable().optional(),
  item_name: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  attachment_path: z.string().nullable().optional(),
  attachment_url: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = ChatTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid transaction data", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const p = parsed.data;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      transaction_type: p.transaction_type,
      amount: p.amount,
      currency: p.currency || "IDR",
      transaction_date: p.transaction_date || new Date().toISOString().slice(0, 10),
      merchant_name: p.merchant_name ?? null,
      item_name: p.item_name ?? null,
      category: p.category ?? null,
      payment_method: p.payment_method ?? null,
      notes: p.notes ?? null,
      attachment_path: p.attachment_path ?? null,
      attachment_url: p.attachment_url ?? null,
      source_channel: "website",
      // Must be unique: the table has a global UNIQUE constraint on
      // source_reference, so a constant would collide on the 2nd chat insert.
      source_reference: `ai-chat:${crypto.randomUUID()}`,
      parsed_status: "parsed",
      reviewed_by_user: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Index for semantic search (best-effort; won't block or fail the insert).
  await embedAndStoreTransaction(supabase, data.id, {
    transaction_type: p.transaction_type,
    amount: p.amount,
    currency: p.currency || "IDR",
    transaction_date: data.transaction_date,
    merchant_name: p.merchant_name ?? null,
    item_name: p.item_name ?? null,
    category: p.category ?? null,
    payment_method: p.payment_method ?? null,
    notes: p.notes ?? null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
