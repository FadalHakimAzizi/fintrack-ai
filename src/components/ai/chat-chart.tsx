import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";

export interface ChatChartData {
  type?: string;
  title?: string;
  unit?: string;
  data: { label: string; value: number }[];
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

export function ChatChart({ chart }: { chart: ChatChartData }) {
  const rows = chart.data;
  if (!rows?.length) return null;

  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const isCurrency = !chart.unit || /^[A-Za-z]{3}$/.test(chart.unit);
  const fmt = (v: number) =>
    isCurrency
      ? formatCurrency(v, (chart.unit || "IDR").toUpperCase())
      : `${v.toLocaleString("id-ID")}${chart.unit ? ` ${chart.unit}` : ""}`;

  return (
    <div className="rounded-2xl rounded-tl-sm border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-body-sm font-semibold text-on-surface">
        <Icon name="bar_chart" filled className="text-primary" />
        {chart.title || "Rincian"}
      </div>
      <ul className="space-y-3">
        {rows.map((r, i) => {
          const pct = (r.value / max) * 100;
          const share = total ? (r.value / total) * 100 : 0;
          const color = COLORS[i % COLORS.length];
          return (
            <li key={i} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-body-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-on-surface">{r.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-medium tabular text-on-surface">{fmt(r.value)}</span>
                  {total > 0 && rows.length > 1 ? (
                    <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-label-caps tabular text-on-surface-variant">
                      {share.toFixed(0)}%
                    </span>
                  ) : null}
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
    </div>
  );
}
