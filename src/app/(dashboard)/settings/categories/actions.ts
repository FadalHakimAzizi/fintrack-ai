"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CategoryInput = z.object({
  name: z.string().min(1, "Name required").max(50),
  kind: z.enum(["income", "expense"]),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function createCategory(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = CategoryInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const { name, kind, color, icon } = parsed.data;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: name.trim(),
    kind,
    color: color || null,
    icon: icon || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/categories");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/categories");
  return { ok: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = CategoryInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const { name, kind, color, icon } = parsed.data;

  const { error } = await supabase
    .from("categories")
    .update({ name: name.trim(), kind, color: color || null, icon: icon || null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/categories");
  return { ok: true };
}
