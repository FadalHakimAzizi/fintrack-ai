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

export function CategoryDonut({ rows, currency }: { rows: Row[]; currency: string }) {
  if (rows.length === 0) {
    return (
      <div className="text-body-sm text-on-surface-variant py-10 text-center">
        Belum ada data pengeluaran. Tambah transaksi untuk melihat rinciannya.
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + r.total, 0);
  const size = 176;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;

  return (
    <div>
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          {/* track */}
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="rgb(var(--surface-container))"
            strokeWidth={stroke}
          />
          {rows.map((row, i) => {
            const frac = total ? row.total / total : 0;
            const len = frac * C;
            const dash = Math.max(len - 3, 0.001); // 3px breathing gap between slices
            const seg = (
              <circle
                key={row.category}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-acc * C}
              />
            );
            acc += frac;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-label-caps uppercase tracking-wider text-on-surface-variant">
              Total
            </div>
            <div className="mt-0.5 font-h2 text-h3 tabular text-on-surface">
              {compact(total, currency)}
            </div>
            <div className="text-label-caps text-outline">{rows.length} kategori</div>
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-0.5">
        {rows.map((row, i) => {
          const pct = total ? (row.total / total) * 100 : 0;
          return (
            <li
              key={row.category}
              className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-body-sm transition-colors hover:bg-surface-container-low"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate font-medium text-on-surface">{row.category}</span>
              <span className="ml-auto shrink-0 rounded-full bg-surface-container px-1.5 py-0.5 text-label-caps tabular text-on-surface-variant">
                {pct.toFixed(0)}%
              </span>
              <span className="w-24 shrink-0 text-right font-medium tabular text-on-surface">
                {formatCurrency(row.total, currency)}
              </span>
            </li>
          );
        })}
      </ul>
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
