"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ProfileInput = z.object({
  full_name: z.string().max(120),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code"),
});

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = ProfileInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, currency: parsed.data.currency })
    .eq("id", user.id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

const IntegrationInput = z.object({
  channel: z.enum(["telegram", "gmail"]),
  identifier: z.string().min(1),
  label: z.string().optional().nullable(),
});

export async function addIntegration(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = IntegrationInput.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Invalid" };
  }

  const id = parsed.data.channel === "gmail"
    ? parsed.data.identifier.toLowerCase()
    : parsed.data.identifier;

  const { error } = await supabase.from("user_integrations").insert({
    user_id: user.id,
    channel: parsed.data.channel,
    identifier: id,
    label: parsed.data.label || null,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings");
  return { ok: true as const };
}

export async function removeIntegration(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("user_integrations").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/settings");
  return { ok: true as const };
}
