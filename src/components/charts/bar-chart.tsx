import { formatCurrency } from "@/lib/utils";

interface Row {
  label: string;
  value: number;
  color?: string;
}

const DEFAULT_COLORS = [
  "#1e40af",
  "#006c49",
  "#611e00",
  "#3755c3",
  "#173bab",
  "#872d00",
  "#757684",
];

export function HorizontalBars({
  rows,
  currency = "IDR",
}: {
  rows: Row[];
  currency?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="text-body-sm text-outline py-8 text-center">
        No data to display.
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const color = r.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        return (
          <li key={r.label} className="space-y-1">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-on-surface font-medium truncate pr-2">
                {r.label}
              </span>
              <span className="text-on-surface-variant tabular shrink-0">
                {formatCurrency(r.value, currency)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function VerticalBars({
  labels,
  values,
  currency = "IDR",
  color = "#1e40af",
  height = 180,
}: {
  labels: string[];
  values: number[];
  currency?: string;
  color?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {labels.map((lab, i) => {
        const h = (values[i] / max) * (height - 30);
        return (
          <div key={lab + i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all relative group"
              style={{
                height: Math.max(h, 2),
                backgroundColor: color,
              }}
              title={`${lab}: ${formatCurrency(values[i], currency)}`}
            />
            <span className="text-label-caps text-outline uppercase">{lab}</span>
          </div>
        );
      })}
    </div>
  );
}
