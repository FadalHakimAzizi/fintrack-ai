import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Webhook for n8n-originated transactions (Gmail parser, Telegram bot, OCR, etc.).
 *
 * Auth: header `x-webhook-secret` must match env N8N_WEBHOOK_SECRET.
 * Identity: payload MUST include `user_id` (resolved in n8n from source_reference,
 * e.g. Telegram chat_id lookup or Gmail address lookup). No session cookie is used,
 * so the service-role key is required here — RLS is bypassed intentionally.
 */

const Payload = z.object({
  user_id: z.string().uuid(),
  transaction_type: z.enum(["income", "expense"]),
  amount: z.number().nonnegative(),
  transaction_date: z.string().optional(),
  merchant_name: z.string().optional().nullable(),
  item_name: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  account_name: z.string().optional().nullable(),
  currency: z.string().optional(),
  notes: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  source_channel: z.enum(["telegram", "gmail", "ocr", "api", "website"]),
  source_reference: z.string().optional().nullable(),
  attachment_url: z.string().url().optional().nullable(),
  attachment_path: z.string().optional().nullable(),
  confidence_score: z.number().min(0).max(1).optional().nullable(),
  parsed_status: z.enum(["pending", "parsed", "reviewed", "failed"]).optional(),
});

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const p = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: p.user_id,
      transaction_type: p.transaction_type,
      amount: p.amount,
      transaction_date: p.transaction_date || new Date().toISOString().slice(0, 10),
      merchant_name: p.merchant_name ?? null,
      item_name: p.item_name ?? null,
      category: p.category ?? null,
      payment_method: p.payment_method ?? null,
      account_name: p.account_name ?? null,
      currency: p.currency || "IDR",
      notes: p.notes ?? null,
      invoice_number: p.invoice_number ?? null,
      location: p.location ?? null,
      tags: p.tags ?? [],
      source_channel: p.source_channel,
      source_reference: p.source_reference ?? null,
      attachment_url: p.attachment_url ?? null,
      attachment_path: p.attachment_path ?? null,
      confidence_score: p.confidence_score ?? null,
      parsed_status: p.parsed_status || "parsed",
      reviewed_by_user: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "n8n webhook ready" });
}
