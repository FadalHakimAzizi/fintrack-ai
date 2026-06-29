"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import { formatCurrency, cn } from "@/lib/utils";

interface Props {
  /** 12 months of data; the toggle slices the tail to 6 or 12. */
  labels: string[];
  income: number[];
  expense: number[];
  currency: string;
}

const INCOME_COLOR = "#0d9488";
const EXPENSE_COLOR = "#d97706";
const NET_COLOR = "#3755c3";

export function TrendChart({ labels, income, expense, currency }: Props) {
  const [range, setRange] = useState<6 | 12>(6);

  const start = Math.max(0, labels.length - range);
  const l = labels.slice(start);
  const inc = income.slice(start);
  const exp = expense.slice(start);

  const totalInc = inc.reduce((s, v) => s + v, 0);
  const totalExp = exp.reduce((s, v) => s + v, 0);

  return (
    <Card className="animate-fade-up">
      <CardHeader
        title="Tren Arus Kas"
        subtitle="Pemasukan vs pengeluaran · klik legenda untuk toggle"
        action={
          <div
            role="tablist"
            aria-label="Rentang waktu"
            className="inline-flex rounded-full bg-surface-container p-1 text-body-sm"
          >
            {([6, 12] as const).map((n) => (
              <button
                key={n}
                role="tab"
                aria-selected={range === n}
                onClick={() => setRange(n)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 font-semibold transition-all duration-200",
                  range === n
                    ? "bg-surface-container-lowest text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {n === 6 ? "6 Bulan" : "1 Tahun"}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryChip label="Masuk" value={formatCurrency(totalInc, currency)} color={INCOME_COLOR} />
        <SummaryChip label="Keluar" value={formatCurrency(totalExp, currency)} color={EXPENSE_COLOR} />
        <SummaryChip
          label="Selisih"
          value={formatCurrency(totalInc - totalExp, currency)}
          color={NET_COLOR}
        />
      </div>

      <LineChart
        showLegend
        labels={l}
        currency={currency}
        series={[
          { label: "Income", color: INCOME_COLOR, values: inc },
          { label: "Expense", color: EXPENSE_COLOR, values: exp },
        ]}
      />
    </Card>
  );
}

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-label-caps uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
      </div>
      <div className="mt-1 truncate font-h3 text-body-md tabular text-on-surface">{value}</div>
    </div>
  );
}
