"use client";

import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  addIntegration,
  removeIntegration,
} from "@/app/(dashboard)/settings/actions";
import { formatDate } from "@/lib/utils";

interface Integration {
  id: string;
  channel: "telegram" | "gmail";
  identifier: string;
  label: string | null;
  created_at: string;
}

const CHANNEL_META = {
  telegram: { icon: "send", label: "Telegram" },
  gmail: { icon: "mail", label: "Gmail" },
} as const;

export function Integrations({ items }: { items: Integration[] }) {
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
    if (!confirm("Unlink this integration?")) return;
    await removeIntegration(id);
  }

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <div className="p-4 rounded-lg border border-dashed border-outline-variant text-body-sm text-outline text-center">
          No linked accounts yet. Add one below to route Telegram / Gmail
          transactions into your account.
        </div>
      ) : (
        <ul className="divide-y divide-outline-variant/50">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-surface-container grid place-items-center shrink-0 text-primary">
                <Icon name={CHANNEL_META[it.channel].icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-md font-semibold text-on-surface truncate">
                  {it.label || CHANNEL_META[it.channel].label}
                </div>
                <div className="text-body-sm text-outline truncate">
                  {CHANNEL_META[it.channel].label} · {it.identifier} · linked {formatDate(it.created_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="text-body-sm text-outline hover:text-error inline-flex items-center gap-1"
              >
                <Icon name="link_off" />
                Unlink
              </button>
            </li>
          ))}
        </ul>
      )}

      <form id="int-form" action={onAdd} className="grid grid-cols-1 md:grid-cols-[140px_1fr_1fr_auto] gap-3 items-end">
        {error ? (
          <div className="md:col-span-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
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
            placeholder="chat_id or email address"
            required
          />
        </div>
        <div>
          <Label htmlFor="i-label">Label (optional)</Label>
          <Input
            id="i-label"
            name="label"
            type="text"
            placeholder="e.g. My personal Telegram"
          />
        </div>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "..." : "Link"}
        </Button>
      </form>
      <p className="text-body-sm text-outline">
        Telegram identifier is the numeric <code>chat_id</code>. Gmail identifier is the full email address (stored lowercased).
      </p>
    </div>
  );
}
