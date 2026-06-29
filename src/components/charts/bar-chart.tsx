import { formatCurrency } from "@/lib/utils";

interface Row {
  label: string;
  value: number;
  color?: string;
}

const COLORS = [
  "#3755c3",
  "#0d9488",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#e11d48",
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
      <div className="text-body-sm text-on-surface-variant py-8 text-center">
        Belum ada data untuk ditampilkan.
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-4">
      {rows.map((r, i) => {
        const pct = (r.value / max) * 100;
        const share = total ? (r.value / total) * 100 : 0;
        const color = r.color || COLORS[i % COLORS.length];
        return (
          <li key={r.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-body-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-label-caps font-semibold"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  {i + 1}
                </span>
                <span className="truncate font-medium text-on-surface">{r.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular text-on-surface-variant">
                  {formatCurrency(r.value, currency)}
                </span>
                <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-label-caps tabular text-on-surface-variant">
                  {share.toFixed(0)}%
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className="animate-bar-grow h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundImage: `linear-gradient(90deg, ${color}b3, ${color})`,
                  animationDelay: `${i * 60}ms`,
                }}
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
  color = "#3755c3",
  height = 200,
}: {
  labels: string[];
  values: number[];
  currency?: string;
  color?: string;
  height?: number;
}) {
  const hasData = values.some((v) => v > 0);
  if (!hasData) {
    return (
      <div
        className="grid place-items-center text-body-sm text-on-surface-variant"
        style={{ height }}
      >
        Belum ada data untuk ditampilkan.
      </div>
    );
  }
  const max = Math.max(...values, 1);
  const maxIdx = values.indexOf(Math.max(...values));
  const barArea = height - 44; // leave room for value label + axis label

  return (
    <div
      className="flex items-end gap-2 sm:gap-3"
      style={{ height }}
      role="img"
      aria-label={
        "Grafik batang: " +
        labels.map((l, i) => `${l} ${formatCurrency(values[i], currency)}`).join(", ")
      }
    >
      {labels.map((lab, i) => {
        const isMax = i === maxIdx && values[i] > 0;
        const h = (values[i] / max) * barArea;
        return (
          <div key={lab + i} className="group flex flex-1 flex-col items-center gap-1.5">
            <span
              className={
                "text-label-caps tabular " +
                (isMax ? "font-bold text-primary" : "text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100")
              }
            >
              {compact(values[i], currency)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-300 group-hover:brightness-110"
              style={{
                height: Math.max(h, 3),
                backgroundImage: isMax
                  ? `linear-gradient(180deg, ${color}, ${color}cc)`
                  : `linear-gradient(180deg, ${color}80, ${color}40)`,
              }}
              title={`${lab}: ${formatCurrency(values[i], currency)}`}
            />
            <span
              className={
                "text-label-caps uppercase " +
                (isMax ? "font-semibold text-on-surface" : "text-on-surface-variant")
              }
            >
              {lab}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function compact(n: number, currency: string) {
  const abs = Math.abs(n);
  if (currency === "IDR") {
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}jt`;
    if (abs >= 1_000) return `${Math.round(n / 1_000)}rb`;
    return String(Math.round(n));
  }
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}
