import { Icon } from "@/components/ui/icon";
import { formatCurrency, cn } from "@/lib/utils";
import type { SavingsGoal } from "@/lib/types";

export function GoalsSummary({
  goals,
  currency,
}: {
  goals: SavingsGoal[];
  currency: string;
}) {
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
  const pct = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const active = goals.filter((g) => g.status !== "completed").length;
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <section className="animate-fade-up surface-sheen relative overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card md:p-7">
      <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="text-label-caps uppercase tracking-wider text-on-surface-variant">
              Total ditabung
            </p>
            <p className="mt-1 break-words font-display text-h1 tabular text-on-surface">
              {formatCurrency(totalSaved, currency)}
            </p>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              dari{" "}
              <span className="font-medium text-on-surface">
                {formatCurrency(totalTarget, currency)}
              </span>{" "}
              total target
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1.5 text-body-sm font-semibold text-secondary">
            <Icon name="savings" filled />
            {pct.toFixed(0)}% tercapai
          </div>
        </div>

        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-surface-container">
          <div
            className="animate-bar-grow h-full rounded-full"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundImage: "linear-gradient(90deg,#10b981,#0d9488)",
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Mini icon="flag" label="Total target" value={String(goals.length)} />
          <Mini icon="bolt" label="Aktif" value={String(active)} tone="primary" />
          <Mini icon="check_circle" label="Selesai" value={String(completed)} tone="secondary" />
        </div>
      </div>
    </section>
  );
}

function Mini({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3">
      <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
        <Icon name={icon} className="text-[18px]" />
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-h2 text-h3 tabular",
          tone === "secondary" ? "text-secondary" : tone === "primary" ? "text-primary" : "text-on-surface",
        )}
      >
        {value}
      </div>
    </div>
  );
}
