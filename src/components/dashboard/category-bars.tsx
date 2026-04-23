import { formatCurrency } from "@/lib/utils";

interface Row {
  category: string;
  total: number;
}

const COLORS = [
  "#1e40af",
  "#006c49",
  "#611e00",
  "#3755c3",
  "#173bab",
  "#872d00",
  "#757684",
];

export function CategoryBars({ rows, currency }: { rows: Row[]; currency: string }) {
  if (rows.length === 0) {
    return (
      <div className="text-body-sm text-outline py-10 text-center">
        No expense data yet. Add a transaction to see your breakdown.
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const pct = (r.total / max) * 100;
        return (
          <li key={r.category} className="space-y-1">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-on-surface font-medium">{r.category}</span>
              <span className="text-on-surface-variant tabular">
                {formatCurrency(r.total, currency)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
