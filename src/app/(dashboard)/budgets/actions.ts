"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BudgetInput = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().min(0),
  month: z.string().min(1), // YYYY-MM
  currency: z.string().default("IDR"),
  notes: z.string().optional().nullable(),
});

function monthStart(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7) + "-01";
  throw new Error("Invalid month format");
}

export async function upsertBudget(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());
  const parsed = BudgetInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const v = parsed.data;

  const { error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category: v.category,
        amount: v.amount,
        month: monthStart(v.month),
        currency: v.currency || "IDR",
        notes: v.notes || null,
      },
      { onConflict: "user_id,category,month" },
    );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteBudget(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
