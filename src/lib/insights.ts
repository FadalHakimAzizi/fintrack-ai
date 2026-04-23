import type { Transaction } from "@/lib/types";

export type InsightTone = "info" | "good" | "warn" | "alert";

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  detail: string;
}

export interface RecurringCandidate {
  merchant: string;
  category: string | null;
  averageAmount: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  currency: string;
}

function firstOfMonthOffset(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + offset);
  return d;
}

function sumExpenses(rows: Transaction[]) {
  return rows
    .filter((r) => r.transaction_type === "expense")
    .reduce((s, r) => s + Number(r.amount), 0);
}

function sumIncome(rows: Transaction[]) {
  return rows
    .filter((r) => r.transaction_type === "income")
    .reduce((s, r) => s + Number(r.amount), 0);
}

function byCategory(rows: Transaction[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (r.transaction_type !== "expense") continue;
    const k = r.category || "Uncategorized";
    m.set(k, (m.get(k) || 0) + Number(r.amount));
  }
  return m;
}

export function computeInsights(
  transactions: Transaction[],
  opts?: { currency?: string },
): Insight[] {
  const insights: Insight[] = [];
  if (transactions.length === 0) {
    insights.push({
      id: "empty",
      tone: "info",
      icon: "lightbulb",
      title: "Belum ada data cukup",
      detail:
        "Tambah beberapa transaksi supaya kami bisa kasih ringkasan dan insight otomatis.",
    });
    return insights;
  }

  const thisMonthStart = firstOfMonthOffset(0);
  const lastMonthStart = firstOfMonthOffset(-1);
  const thisMonthEnd = firstOfMonthOffset(1);

  const inRange = (r: Transaction, start: Date, end: Date) => {
    const d = new Date(r.transaction_date + "T00:00:00");
    return d >= start && d < end;
  };

  const thisMonth = transactions.filter((r) =>
    inRange(r, thisMonthStart, thisMonthEnd),
  );
  const lastMonth = transactions.filter((r) =>
    inRange(r, lastMonthStart, thisMonthStart),
  );

  const thisExp = sumExpenses(thisMonth);
  const lastExp = sumExpenses(lastMonth);
  const thisInc = sumIncome(thisMonth);

  // 1. MoM expense delta
  if (lastExp > 0) {
    const delta = thisExp - lastExp;
    const pct = (delta / lastExp) * 100;
    if (Math.abs(pct) >= 10) {
      insights.push({
        id: "mom-delta",
        tone: pct > 0 ? "warn" : "good",
        icon: pct > 0 ? "trending_up" : "trending_down",
        title:
          pct > 0
            ? `Pengeluaran naik ${pct.toFixed(0)}% dari bulan lalu`
            : `Pengeluaran turun ${Math.abs(pct).toFixed(0)}% dari bulan lalu`,
        detail: `Bulan ini: ${formatIDR(thisExp, opts?.currency)}. Bulan lalu: ${formatIDR(lastExp, opts?.currency)}.`,
      });
    }
  }

  // 2. Top category dominance
  const catMap = byCategory(thisMonth);
  const topCat = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCat && thisExp > 0) {
    const share = (topCat[1] / thisExp) * 100;
    if (share >= 30) {
      insights.push({
        id: "top-cat",
        tone: share >= 50 ? "alert" : "info",
        icon: "category",
        title: `${topCat[0]} = ${share.toFixed(0)}% pengeluaran bulan ini`,
        detail: `${formatIDR(topCat[1], opts?.currency)} untuk kategori ${topCat[0]}.`,
      });
    }
  }

  // 3. Category spike vs last month
  const lastCatMap = byCategory(lastMonth);
  let biggestSpike: { cat: string; pct: number; this: number; last: number } | null =
    null;
  for (const [cat, v] of catMap.entries()) {
    const prev = lastCatMap.get(cat) || 0;
    if (prev < 50_000) continue; // ignore tiny categories (< Rp 50rb)
    const pct = ((v - prev) / prev) * 100;
    if (pct > 50 && (!biggestSpike || pct > biggestSpike.pct)) {
      biggestSpike = { cat, pct, this: v, last: prev };
    }
  }
  if (biggestSpike) {
    insights.push({
      id: "spike",
      tone: "warn",
      icon: "warning",
      title: `${biggestSpike.cat} melonjak ${biggestSpike.pct.toFixed(0)}%`,
      detail: `Dari ${formatIDR(biggestSpike.last, opts?.currency)} jadi ${formatIDR(biggestSpike.this, opts?.currency)} bulan ini.`,
    });
  }

  // 4. Biggest single expense this month
  const bigExp = thisMonth
    .filter((r) => r.transaction_type === "expense")
    .sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  if (bigExp && Number(bigExp.amount) > 0) {
    insights.push({
      id: "biggest",
      tone: "info",
      icon: "star",
      title: `Transaksi terbesar bulan ini: ${formatIDR(Number(bigExp.amount), bigExp.currency)}`,
      detail: `${bigExp.merchant_name || bigExp.item_name || "transaksi"} · ${bigExp.category || "Uncategorized"}`,
    });
  }

  // 5. Savings rate
  if (thisInc > 0 && thisMonth.length > 0) {
    const net = thisInc - thisExp;
    const rate = (net / thisInc) * 100;
    if (rate >= 20) {
      insights.push({
        id: "savings-good",
        tone: "good",
        icon: "savings",
        title: `Saving rate bulan ini ${rate.toFixed(0)}%`,
        detail: `Net ${formatIDR(net, opts?.currency)} dari pemasukan ${formatIDR(thisInc, opts?.currency)}.`,
      });
    } else if (rate < 0) {
      insights.push({
        id: "savings-bad",
        tone: "alert",
        icon: "warning",
        title: `Pengeluaran melebihi pemasukan ${formatIDR(-net, opts?.currency)}`,
        detail: `Pemasukan ${formatIDR(thisInc, opts?.currency)}, pengeluaran ${formatIDR(thisExp, opts?.currency)}.`,
      });
    }
  }

  // 6. No activity today
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = transactions.filter((r) => r.transaction_date === today).length;
  if (todayCount === 0 && thisMonth.length > 0) {
    insights.push({
      id: "no-today",
      tone: "info",
      icon: "event_available",
      title: "Belum ada transaksi hari ini",
      detail: "Tandanya budget hari ini aman — atau lupa catat?",
    });
  }

  return insights.slice(0, 5);
}

export function detectRecurring(transactions: Transaction[]): RecurringCandidate[] {
  // Group expenses by merchant. Consider recurring if:
  //   - occurrences >= 3
  //   - amount variance < 20% of mean
  const groups = new Map<string, Transaction[]>();
  for (const r of transactions) {
    if (r.transaction_type !== "expense") continue;
    const key = (r.merchant_name || r.item_name || "").toLowerCase().trim();
    if (!key) continue;
    const arr = groups.get(key) || [];
    arr.push(r);
    groups.set(key, arr);
  }

  const out: RecurringCandidate[] = [];
  for (const [_, arr] of groups) {
    if (arr.length < 3) continue;
    const amounts = arr.map((r) => Number(r.amount));
    const mean = amounts.reduce((s, n) => s + n, 0) / amounts.length;
    if (mean <= 0) continue;
    const variance =
      amounts.reduce((s, n) => s + Math.abs(n - mean), 0) / amounts.length;
    if (variance / mean > 0.2) continue;

    const sorted = [...arr].sort((a, b) =>
      a.transaction_date < b.transaction_date ? -1 : 1,
    );
    out.push({
      merchant:
        sorted[0].merchant_name || sorted[0].item_name || "Unknown",
      category: sorted[0].category,
      averageAmount: mean,
      occurrences: arr.length,
      firstSeen: sorted[0].transaction_date,
      lastSeen: sorted[sorted.length - 1].transaction_date,
      currency: sorted[0].currency || "IDR",
    });
  }

  return out.sort((a, b) => b.averageAmount - a.averageAmount).slice(0, 10);
}

export function dayOfWeekPattern(transactions: Transaction[]): number[] {
  // index 0 = Monday ... 6 = Sunday (Indonesian week convention)
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const r of transactions) {
    if (r.transaction_type !== "expense") continue;
    const d = new Date(r.transaction_date + "T00:00:00");
    const dow = (d.getDay() + 6) % 7; // Sun(0)→6, Mon(1)→0, ...
    buckets[dow] += Number(r.amount);
  }
  return buckets;
}

export function monthlyTrend(
  transactions: Transaction[],
  months = 6,
): { labels: string[]; income: number[]; expense: number[] } {
  const labels: string[] = [];
  const income: number[] = [];
  const expense: number[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const startISO = start.toISOString().slice(0, 10);
    const endISO = end.toISOString().slice(0, 10);
    const rows = transactions.filter(
      (r) => r.transaction_date >= startISO && r.transaction_date < endISO,
    );
    labels.push(
      start.toLocaleDateString("id-ID", { month: "short" }).replace(".", ""),
    );
    income.push(sumIncome(rows));
    expense.push(sumExpenses(rows));
  }
  return { labels, income, expense };
}

function formatIDR(n: number, currency = "IDR") {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString("id-ID")}`;
  }
}
