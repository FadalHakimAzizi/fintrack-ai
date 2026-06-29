import { Icon } from "@/components/ui/icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecurringCandidate } from "@/lib/insights";

const AVATAR = [
  "bg-primary/12 text-primary",
  "bg-secondary/15 text-secondary",
  "bg-tertiary/15 text-tertiary",
  "bg-error/12 text-error",
];

export function RecurringList({
  items,
  currency,
}: {
  items: RecurringCandidate[];
  currency: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-container">
          <Icon name="autorenew" className="text-outline" />
        </div>
        <p className="text-body-md font-medium text-on-surface">Belum ada pola berulang</p>
        <p className="mx-auto mt-1 max-w-md text-body-sm text-on-surface-variant">
          Kami menandai merchant dengan ≥3 transaksi bernominal stabil. Terus catat
          transaksimu agar pola langganan terdeteksi otomatis.
        </p>
      </div>
    );
  }

  const cycleEstimate = items.reduce((s, r) => s + r.averageAmount, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low/60 px-4 py-3 ring-1 ring-inset ring-outline-variant/30">
        <span className="inline-flex items-center gap-2 text-body-sm font-medium text-on-surface">
          <Icon name="autorenew" filled className="text-primary" />
          {items.length} langganan terdeteksi
        </span>
        <div className="text-right">
          <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">
            Estimasi / siklus
          </div>
          <div className="font-h3 text-body-md tabular text-on-surface">
            ~{formatCurrency(Math.round(cycleEstimate), currency)}
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((r, i) => (
          <li
            key={r.merchant}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/40 p-3 transition-colors hover:bg-surface-container-low"
          >
            <div
              className={
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-h2 text-body-md font-bold " +
                AVATAR[i % AVATAR.length]
              }
            >
              {r.merchant.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-on-surface">{r.merchant}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-label-caps font-semibold text-primary">
                  <Icon name="repeat" className="text-[14px]" />
                  {r.occurrences}×
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                <span className="truncate">{r.category || "Uncategorized"}</span>
                <span>·</span>
                <span className="shrink-0">terakhir {formatDate(r.lastSeen)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-semibold tabular text-on-surface">
                ~{formatCurrency(Math.round(r.averageAmount), r.currency)}
              </div>
              <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">
                rata-rata
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
