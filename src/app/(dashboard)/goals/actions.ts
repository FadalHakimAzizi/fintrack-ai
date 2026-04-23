"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const GoalInput = z.object({
  name: z.string().min(1, "Name required").max(100),
  target_amount: z.coerce.number().min(1, "Target must be > 0"),
  current_amount: z.coerce.number().min(0).default(0),
  target_date: z.string().optional().nullable(),
  currency: z.string().default("IDR"),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createGoal(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData);
  const parsed = GoalInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const v = parsed.data;

  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    name: v.name,
    target_amount: v.target_amount,
    current_amount: v.current_amount,
    target_date: v.target_date || null,
    currency: v.currency,
    icon: v.icon || null,
    color: v.color || null,
    notes: v.notes || null,
    status: "active",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/goals");
  return { ok: true };
}

export async function updateGoalAmount(id: string, newAmount: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("target_amount")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const status = goal && newAmount >= Number(goal.target_amount) ? "completed" : "active";

  const { error } = await supabase
    .from("savings_goals")
    .update({ current_amount: newAmount, status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/goals");
  return { ok: true };
}

export async function deleteGoal(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/goals");
  return { ok: true };
}
