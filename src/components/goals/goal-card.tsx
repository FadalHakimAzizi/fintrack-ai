"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { updateGoalAmount, deleteGoal, createGoal } from "@/app/(dashboard)/goals/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { SavingsGoal } from "@/lib/types";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function GoalCard({ goal }: { goal: SavingsGoal }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [newAmount, setNewAmount] = useState(String(goal.current_amount));
  const [saving, setSaving] = useState(false);

  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const days = daysUntil(goal.target_date);
  const completed = goal.status === "completed";
  const color = goal.color || "#3755c3";

  // Monthly contribution needed to hit the target by the target date.
  const monthsLeft = days !== null && days > 0 ? Math.max(1, Math.ceil(days / 30)) : null;
  const perMonth = !completed && monthsLeft && remaining > 0 ? remaining / monthsLeft : null;

  // Progress ring geometry
  const R = 16;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  async function handleSave() {
    setSaving(true);
    const result = await updateGoalAmount(goal.id, Number(newAmount));
    setSaving(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
      toast({ message: "Progress diperbarui", tone: "success" });
    } else {
      toast({ message: result.error || "Gagal menyimpan", tone: "error" });
    }
  }

  async function restore() {
    const fd = new FormData();
    fd.set("name", goal.name);
    fd.set("target_amount", String(goal.target_amount));
    fd.set("current_amount", String(goal.current_amount));
    if (goal.target_date) fd.set("target_date", goal.target_date);
    fd.set("currency", goal.currency);
    if (goal.icon) fd.set("icon", goal.icon);
    if (goal.color) fd.set("color", goal.color);
    if (goal.notes) fd.set("notes", goal.notes);
    await createGoal(fd);
    router.refresh();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Hapus goal "${goal.name}"?`,
      description: "Target tabungan ini akan dihapus. Anda bisa mengurungkannya.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    const result = await deleteGoal(goal.id);
    if (result.ok) {
      router.refresh();
      toast({
        message: `Goal "${goal.name}" dihapus`,
        tone: "success",
        action: { label: "Urungkan", onClick: restore },
      });
    } else {
      toast({ message: result.error || "Gagal menghapus", tone: "error" });
    }
  }

  return (
    <div className={cn(
      "group rounded-xl border bg-surface-container-lowest p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
      completed ? "border-secondary/40" : "border-outline-variant/30",
    )}>
      <div className="mb-4 flex items-start gap-3.5">
        {/* Circular progress ring with the goal icon at its center */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r={R} fill="none" stroke="rgb(var(--surface-container-high))" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center" style={{ color }}>
            <Icon name={goal.icon || "savings"} filled />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-body-md font-semibold text-on-surface">{goal.name}</h3>
            {completed && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-label-caps font-semibold text-secondary">
                <Icon name="check_circle" filled className="text-[14px]" />
                Selesai!
              </span>
            )}
          </div>
          {goal.target_date ? (
            <div className={cn(
              "mt-0.5 flex items-center gap-1 text-body-sm",
              days !== null && days < 0 ? "text-error" : "text-on-surface-variant",
            )}>
              <Icon name="calendar_today" className="text-[16px]" />
              {days !== null && days < 0
                ? `Telat ${Math.abs(days)} hari`
                : days !== null && days === 0
                ? "Jatuh tempo hari ini!"
                : `${days} hari lagi · ${formatDate(goal.target_date)}`}
            </div>
          ) : (
            <div className="mt-0.5 text-body-sm text-on-surface-variant">Tanpa tenggat</div>
          )}
        </div>

        <button
          onClick={handleDelete}
          aria-label="Hapus goal"
          title="Hapus target"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant/50 transition-colors hover:bg-error-container hover:text-error"
        >
          <Icon name="delete" className="text-[20px]" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="font-display text-h3 tabular text-on-surface">
              {formatCurrency(goal.current_amount, goal.currency)}
            </span>
            <span className="ml-1 text-body-sm text-on-surface-variant">
              / {formatCurrency(goal.target_amount, goal.currency)}
            </span>
          </div>
          <span className="shrink-0 font-h2 text-body-lg tabular" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="animate-bar-grow h-full rounded-full"
            style={{ width: `${pct}%`, backgroundImage: `linear-gradient(90deg, ${color}b3, ${color})` }}
          />
        </div>
        {completed ? (
          <p className="mt-2 flex items-center gap-1 text-body-sm font-medium text-secondary">
            <Icon name="celebration" filled className="text-[16px]" />
            Target tercapai — selamat!
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-body-sm text-on-surface-variant">
            <span>Sisa {formatCurrency(remaining, goal.currency)}</span>
            {perMonth ? (
              <span className="inline-flex items-center gap-1 font-medium text-on-surface">
                <Icon name="trending_up" className="text-[16px] text-secondary" />
                ≈{formatCurrency(Math.round(perMonth), goal.currency)}/bln
              </span>
            ) : null}
          </div>
        )}
      </div>

      {!editing ? (
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Icon name="edit" />
          Perbarui jumlah
        </Button>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor={`amount-${goal.id}`} className="text-label-caps">Jumlah saat ini</Label>
            <Input
              id={`amount-${goal.id}`}
              type="number"
              min="0"
              step="1000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "..." : "Simpan"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Batal
          </Button>
        </div>
      )}

      {goal.notes && (
        <p className="text-body-sm text-outline mt-3 border-t border-outline-variant/30 pt-3">
          {goal.notes}
        </p>
      )}
    </div>
  );
}
