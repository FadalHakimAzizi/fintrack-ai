import { formatCurrency } from "@/lib/utils";

interface Row {
  category: string;
  total: number;
}

const COLORS = [
  "#3755c3",
  "#0d9488",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
];

export function CategoryBars({ rows, currency }: { rows: Row[]; currency: string }) {
  if (rows.length === 0) {
    return (
      <div className="text-body-sm text-on-surface-variant py-10 text-center">
        Belum ada data pengeluaran. Tambah transaksi untuk melihat rinciannya.
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.total), 1);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return (
    <ul className="space-y-4">
      {rows.map((r, i) => {
        const pct = (r.total / max) * 100;
        const share = grandTotal ? (r.total / grandTotal) * 100 : 0;
        const color = COLORS[i % COLORS.length];
        return (
          <li key={r.category} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-body-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-on-surface">
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-label-caps"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  {i + 1}
                </span>
                <span className="truncate">{r.category}</span>
                <span className="shrink-0 text-on-surface-variant tabular">
                  {share.toFixed(0)}%
                </span>
              </span>
              <span className="shrink-0 text-on-surface-variant tabular">
                {formatCurrency(r.total, currency)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className="animate-bar-grow h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundImage: `linear-gradient(90deg, ${color}b3, ${color})`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
