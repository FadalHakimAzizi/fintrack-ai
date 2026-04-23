"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TransactionInput = z.object({
  transaction_type: z.enum(["income", "expense"]),
  item_name: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  merchant_name: z.string().optional().nullable(),
  transaction_date: z.string().min(1),
  amount: z.coerce.number().min(0),
  quantity: z.coerce.number().optional().nullable(),
  unit_price: z.coerce.number().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  account_name: z.string().optional().nullable(),
  currency: z.string().default("IDR"),
  notes: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  recurring_flag: z.string().optional(),
  recurring_period: z.string().optional().nullable(),
});

function emptyToNull<T>(v: T): T | null {
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

export async function createTransaction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = TransactionInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const v = parsed.data;

  const tagsArray = v.tags
    ? v.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const attachmentPath = String(formData.get("attachment_path") || "") || null;
  const attachmentUrl = String(formData.get("attachment_url") || "") || null;

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      transaction_type: v.transaction_type,
      item_name: emptyToNull(v.item_name),
      category: emptyToNull(v.category),
      merchant_name: emptyToNull(v.merchant_name),
      transaction_date: v.transaction_date,
      amount: v.amount,
      quantity: v.quantity ?? null,
      unit_price: v.unit_price ?? null,
      payment_method: emptyToNull(v.payment_method),
      account_name: emptyToNull(v.account_name),
      currency: v.currency || "IDR",
      notes: emptyToNull(v.notes),
      invoice_number: emptyToNull(v.invoice_number),
      location: emptyToNull(v.location),
      tags: tagsArray,
      recurring_flag: v.recurring_flag === "on",
      recurring_period: v.recurring_flag === "on" ? (emptyToNull(v.recurring_period) ?? "monthly") : null,
      source_channel: "website",
      parsed_status: "parsed",
      reviewed_by_user: true,
      attachment_path: attachmentPath,
      attachment_url: attachmentUrl,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect(`/transactions/${data.id}`);
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = TransactionInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const v = parsed.data;

  const tagsArray = v.tags
    ? v.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const attachmentPath = String(formData.get("attachment_path") || "") || null;
  const attachmentUrl = String(formData.get("attachment_url") || "") || null;

  const { error } = await supabase
    .from("transactions")
    .update({
      transaction_type: v.transaction_type,
      item_name: emptyToNull(v.item_name),
      category: emptyToNull(v.category),
      merchant_name: emptyToNull(v.merchant_name),
      transaction_date: v.transaction_date,
      amount: v.amount,
      payment_method: emptyToNull(v.payment_method),
      account_name: emptyToNull(v.account_name),
      currency: v.currency || "IDR",
      notes: emptyToNull(v.notes),
      invoice_number: emptyToNull(v.invoice_number),
      location: emptyToNull(v.location),
      tags: tagsArray,
      recurring_flag: v.recurring_flag === "on",
      recurring_period: v.recurring_flag === "on" ? (emptyToNull(v.recurring_period) ?? "monthly") : null,
      reviewed_by_user: true,
      ...(attachmentPath ? { attachment_path: attachmentPath, attachment_url: attachmentUrl } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
  redirect(`/transactions/${id}`);
}

export async function deleteTransaction(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  redirect("/transactions");
}
