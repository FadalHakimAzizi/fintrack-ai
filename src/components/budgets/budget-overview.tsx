import { Icon } from "@/components/ui/icon";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  totalBudget: number;
  totalSpent: number;
  monthLabel: string;
  currency: string;
  count: number;
  overCount: number;
  warnCount: number;
}

export function BudgetOverview({
  totalBudget,
  totalSpent,
  monthLabel,
  currency,
  count,
  overCount,
  warnCount,
}: Props) {
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const over = remaining < 0;
  const barPct = Math.min(pct, 100);

  const stroke = over ? "#ef4444" : pct >= 80 ? "#d97706" : "#0d9488";
  const status = over
    ? { cls: "bg-error/12 text-error", icon: "warning", label: "Over budget" }
    : pct >= 80
      ? { cls: "bg-tertiary/15 text-tertiary", icon: "info", label: "Mendekati limit" }
      : { cls: "bg-secondary/15 text-secondary", icon: "check_circle", label: "Aman" };

  const R = 15.5;
  const C = 2 * Math.PI * R;
  const dash = (barPct / 100) * C;

  return (
    <section className="animate-fade-up surface-sheen relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card md:p-7">
      <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Overall progress ring */}
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
            <circle cx="18" cy="18" r={R} fill="none" stroke="rgb(var(--surface-container-high))" strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r={R}
              fill="none"
              stroke={stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C - dash}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-display text-h2 leading-none tabular text-on-surface">
                {pct.toFixed(0)}%
              </div>
              <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">
                terpakai
              </div>
            </div>
          </div>
        </div>

        {/* Figures */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">
            Ringkasan · {monthLabel}
          </p>
          <p className="mt-1 break-words font-display text-h1 tabular text-on-surface">
            {formatCurrency(totalSpent, currency)}
          </p>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            terpakai dari{" "}
            <span className="font-medium text-on-surface">{formatCurrency(totalBudget, currency)}</span>
          </p>
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-semibold",
              status.cls,
            )}
          >
            <Icon name={status.icon} filled />
            {status.label}
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Mini icon="savings" label="Anggaran" value={formatCurrency(totalBudget, currency)} />
        <Mini
          icon="account_balance_wallet"
          label={over ? "Defisit" : "Sisa"}
          value={formatCurrency(remaining, currency)}
          tone={over ? "error" : "secondary"}
        />
        <Mini
          icon="category"
          label="Kategori"
          value={String(count)}
          sub={
            overCount > 0
              ? `${overCount} over budget`
              : warnCount > 0
                ? `${warnCount} mendekati limit`
                : "semua aman"
          }
        />
      </div>
    </section>
  );
}

function Mini({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  tone?: "error" | "secondary";
}) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3">
      <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon name={icon} className="text-[18px]" />
        {label}
      </div>
      <div
        className={cn(
          "mt-1 truncate font-h3 text-body-lg tabular",
          tone === "error" ? "text-error" : tone === "secondary" ? "text-secondary" : "text-on-surface",
        )}
      >
        {value}
      </div>
      {sub ? <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">{sub}</div> : null}
    </div>
  );
}
