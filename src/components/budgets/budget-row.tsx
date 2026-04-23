"use client";

import { Icon } from "@/components/ui/icon";
import { deleteBudget } from "@/app/(dashboard)/budgets/actions";
import { formatCurrency, cn } from "@/lib/utils";
import type { BudgetProgress } from "@/lib/budgets";

const STATUS = {
  safe: { bar: "#006c49", bg: "bg-secondary-container/40", label: "On track" },
  warning: { bar: "#a16300", bg: "bg-tertiary-container/20", label: "Close to limit" },
  over: { bar: "#ba1a1a", bg: "bg-error-container", label: "Over budget" },
} as const;

export function BudgetRow({ p }: { p: BudgetProgress }) {
  const s = STATUS[p.status];
  const pct = Math.min(p.percent, 100);
  const overflowPct = p.percent > 100 ? Math.min(p.percent - 100, 100) : 0;

  async function onDelete() {
    if (!confirm(`Delete budget for ${p.budget.category}?`)) return;
    await deleteBudget(p.budget.id);
  }

  return (
    <div className={cn("p-4 rounded-lg border border-outline-variant/50", s.bg)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="text-body-md font-semibold text-on-surface">
            {p.budget.category}
          </div>
          <div className="text-body-sm text-outline">
            {new Date(p.budget.month + "T00:00:00").toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {s.label}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-body-md font-semibold tabular">
            {formatCurrency(p.spent, p.budget.currency)} /{" "}
            <span className="text-on-surface-variant">
              {formatCurrency(Number(p.budget.amount), p.budget.currency)}
            </span>
          </div>
          <div className="text-body-sm text-outline tabular">
            {p.percent.toFixed(0)}%
            {p.remaining >= 0
              ? ` · ${formatCurrency(p.remaining, p.budget.currency)} left`
              : ` · over by ${formatCurrency(-p.remaining, p.budget.currency)}`}
          </div>
        </div>
      </div>

      <div className="h-2.5 rounded-full bg-surface-container overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: s.bar }}
        />
        {overflowPct > 0 ? (
          <div
            className="h-full absolute top-0 right-0 bg-error/60 animate-pulse"
            style={{ width: `${overflowPct}%` }}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-end mt-2">
        <button
          type="button"
          onClick={onDelete}
          className="text-body-sm text-outline hover:text-error inline-flex items-center gap-1"
        >
          <Icon name="delete" />
          Delete
        </button>
      </div>
    </div>
  );
}
