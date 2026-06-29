"use client";

import { Icon } from "@/components/ui/icon";
import { deleteBudget, upsertBudget } from "@/app/(dashboard)/budgets/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, cn } from "@/lib/utils";
import type { BudgetProgress } from "@/lib/budgets";

const CATEGORY_ICON: Record<string, string> = {
  Groceries: "shopping_cart",
  Dining: "restaurant",
  Transportation: "directions_car",
  Utilities: "bolt",
  Entertainment: "sports_esports",
  Shopping: "shopping_bag",
  Health: "medical_services",
  Other: "category",
};

const STATUS = {
  safe: {
    label: "Aman",
    chip: "bg-secondary/15 text-secondary",
    bar: "linear-gradient(90deg,#10b981,#0d9488)",
    stroke: "#0d9488",
    text: "text-secondary",
  },
  warning: {
    label: "Mendekati limit",
    chip: "bg-tertiary/15 text-tertiary",
    bar: "linear-gradient(90deg,#f59e0b,#d97706)",
    stroke: "#d97706",
    text: "text-tertiary",
  },
  over: {
    label: "Over budget",
    chip: "bg-error/12 text-error",
    bar: "linear-gradient(90deg,#f59e0b,#ef4444)",
    stroke: "#ef4444",
    text: "text-error",
  },
} as const;

// Daily allowance left — only meaningful for the current calendar month.
function dailyLeft(monthISO: string, remaining: number): number | null {
  if (remaining <= 0) return null;
  const now = new Date();
  const curMonth = now.toISOString().slice(0, 7);
  if (monthISO.slice(0, 7) !== curMonth) return null;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
  return remaining / daysLeft;
}

export function BudgetRow({ p }: { p: BudgetProgress }) {
  const s = STATUS[p.status];
  const icon = CATEGORY_ICON[p.budget.category] || "category";
  const pct = Math.min(p.percent, 100);
  const overflowPct = p.percent > 100 ? Math.min(p.percent - 100, 100) : 0;
  const perDay = dailyLeft(p.budget.month, p.remaining);
  const confirm = useConfirm();
  const toast = useToast();

  // Ring geometry
  const R = 16;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  async function restore() {
    const fd = new FormData();
    fd.set("category", p.budget.category);
    fd.set("amount", String(p.budget.amount));
    fd.set("month", p.budget.month);
    fd.set("currency", p.budget.currency);
    if (p.budget.notes) fd.set("notes", p.budget.notes);
    await upsertBudget(fd);
  }

  async function onDelete() {
    const ok = await confirm({
      title: `Hapus budget ${p.budget.category}?`,
      description: "Budget bulan ini akan dihapus. Anda bisa mengurungkannya.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteBudget(p.budget.id);
    if (res?.ok === false) {
      toast({ message: res.error || "Gagal menghapus budget", tone: "error" });
      return;
    }
    toast({
      message: `Budget ${p.budget.category} dihapus`,
      tone: "success",
      action: { label: "Urungkan", onClick: restore },
    });
  }

  return (
    <div className="group rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start gap-3.5">
        {/* Circular progress ring with the category icon at its center */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r={R} fill="none" stroke="rgb(var(--surface-container-high))" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke={s.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center" style={{ color: s.stroke }}>
            <Icon name={icon} filled />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-semibold text-on-surface">{p.budget.category}</span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-label-caps font-semibold",
                s.chip,
              )}
            >
              {s.label}
            </span>
          </div>
          <div className="text-body-sm text-on-surface-variant">
            {new Date(p.budget.month + "T00:00:00").toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus budget ${p.budget.category}`}
          title="Hapus budget"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant/50 transition-colors hover:bg-error-container hover:text-error focus-visible:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
        >
          <Icon name="delete" className="text-[20px]" />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="font-display text-h3 tabular text-on-surface">
              {formatCurrency(p.spent, p.budget.currency)}
            </span>
            <span className="ml-1 text-body-sm text-on-surface-variant">
              / {formatCurrency(Number(p.budget.amount), p.budget.currency)}
            </span>
          </div>
          <span className={cn("shrink-0 font-h2 text-body-lg tabular", s.text)}>
            {p.percent.toFixed(0)}%
          </span>
        </div>

        <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-surface-container">
          <div
            className="animate-bar-grow h-full rounded-full"
            style={{ width: `${pct}%`, backgroundImage: s.bar }}
          />
          {overflowPct > 0 ? (
            <div
              className="absolute right-0 top-0 h-full animate-pulse bg-error/60"
              style={{ width: `${overflowPct}%` }}
            />
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-body-sm text-on-surface-variant">
          <span>
            {p.remaining >= 0
              ? `Sisa ${formatCurrency(p.remaining, p.budget.currency)}`
              : `Lebih ${formatCurrency(-p.remaining, p.budget.currency)}`}
          </span>
          {perDay ? (
            <span className="inline-flex items-center gap-1 font-medium text-on-surface">
              <Icon name="today" className="text-[16px] text-secondary" />
              ≈{formatCurrency(Math.round(perDay), p.budget.currency)}/hari
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
