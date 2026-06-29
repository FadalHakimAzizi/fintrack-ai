"use client";

import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  addIntegration,
  removeIntegration,
} from "@/app/(dashboard)/settings/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate, cn } from "@/lib/utils";

interface Integration {
  id: string;
  channel: "telegram" | "gmail";
  identifier: string;
  label: string | null;
  created_at: string;
}

const CHANNEL_META = {
  telegram: { icon: "send", label: "Telegram", chip: "bg-primary/12 text-primary" },
  gmail: { icon: "mail", label: "Gmail", chip: "bg-error/12 text-error" },
} as const;

export function Integrations({ items }: { items: Integration[] }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onAdd(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const r = await addIntegration(formData);
    setSubmitting(false);
    if (!r.ok) setError(r.error);
    else (document.getElementById("int-form") as HTMLFormElement | null)?.reset();
  }

  async function onRemove(id: string) {
    const ok = await confirm({
      title: "Putuskan integrasi ini?",
      description: "Transaksi dari channel ini tidak akan lagi masuk otomatis.",
      confirmLabel: "Putuskan",
      tone: "danger",
    });
    if (!ok) return;
    const r = await removeIntegration(id);
    if (!r.ok) {
      toast({ message: r.error || "Gagal memutuskan", tone: "error" });
      return;
    }
    toast({ message: "Integrasi diputuskan", tone: "success" });
  }

  return (
    <div className="space-y-5">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/70 p-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-container">
            <Icon name="hub" className="text-outline" />
          </div>
          <p className="text-body-md font-medium text-on-surface">Belum ada akun terhubung</p>
          <p className="mx-auto mt-1 max-w-sm text-body-sm text-on-surface-variant">
            Tambahkan di bawah untuk meneruskan transaksi Telegram / Gmail ke akun Anda secara otomatis.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-center gap-3 rounded-xl border border-outline-variant/40 p-3 transition-colors hover:bg-surface-container-low"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                  CHANNEL_META[it.channel].chip,
                )}
              >
                <Icon name={CHANNEL_META[it.channel].icon} filled />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-on-surface">
                  {it.label || CHANNEL_META[it.channel].label}
                </div>
                <div className="truncate text-body-sm text-on-surface-variant">
                  {CHANNEL_META[it.channel].label} · {it.identifier} · sejak {formatDate(it.created_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                title="Putuskan integrasi"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant/60 transition-colors hover:bg-error-container hover:text-error"
              >
                <Icon name="link_off" className="text-[20px]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        id="int-form"
        action={onAdd}
        className="grid grid-cols-1 items-end gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4 md:grid-cols-[140px_1fr_1fr_auto]"
      >
        {error ? (
          <div className="flex items-center gap-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container md:col-span-4">
            <Icon name="error" filled />
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="i-channel">Channel</Label>
          <Select id="i-channel" name="channel" defaultValue="telegram" required>
            <option value="telegram">Telegram</option>
            <option value="gmail">Gmail</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="i-id">Identifier</Label>
          <Input
            id="i-id"
            name="identifier"
            type="text"
            placeholder="chat_id atau alamat email"
            required
          />
        </div>
        <div>
          <Label htmlFor="i-label">Label (opsional)</Label>
          <Input id="i-label" name="label" type="text" placeholder="mis. Telegram pribadi" />
        </div>
        <Button type="submit" variant="primary" disabled={submitting}>
          <Icon name={submitting ? "progress_activity" : "add_link"} className={submitting ? "animate-spin" : ""} />
          {submitting ? "..." : "Hubungkan"}
        </Button>
      </form>
      <p className="text-body-sm text-on-surface-variant">
        Identifier Telegram adalah <code className="rounded bg-surface-container px-1 py-0.5 text-[13px]">chat_id</code> numerik.
        Identifier Gmail adalah alamat email lengkap (disimpan huruf kecil).
      </p>
    </div>
  );
}
