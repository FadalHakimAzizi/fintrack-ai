import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { HorizontalBars, VerticalBars } from "@/components/charts/bar-chart";
import { InsightsList } from "@/components/dashboard/insights-list";
import { RecurringList } from "@/components/analytics/recurring-list";
import {
  computeInsights,
  detectRecurring,
  dayOfWeekPattern,
  monthlyTrend,
} from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

const DOW_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const DOW_FULL = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function AnalyticsPage() {
  const supabase = createClient();

  // A full year powers the 6-month / 1-year toggle and richer pattern detection.
  const yearAgo = new Date();
  yearAgo.setMonth(yearAgo.getMonth() - 12);
  yearAgo.setDate(1);

  const { data: rows } = await supabase
    .from("transactions")
    .select("*")
    .gte("transaction_date", yearAgo.toISOString().slice(0, 10))
    .order("transaction_date", { ascending: false });

  const { data: profile } = await supabase.from("profiles").select("currency").single();
  const currency = profile?.currency || "IDR";

  const transactions = (rows || []) as Transaction[];
  const insights = computeInsights(transactions, { currency });
  const trend = monthlyTrend(transactions, 12);
  const dow = dayOfWeekPattern(transactions);
  const recurring = detectRecurring(transactions);

  // KPIs over the 12-month window
  const totalIncome = trend.income.reduce((s, v) => s + v, 0);
  const totalExpense = trend.expense.reduce((s, v) => s + v, 0);
  const net = totalIncome - totalExpense;
  const netSeries = trend.income.map((v, i) => v - trend.expense[i]);
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  // Day-of-week highlight
  const dowMax = Math.max(...dow, 0);
  const busiestDow = dowMax > 0 ? DOW_FULL[dow.indexOf(dowMax)] : null;

  // Top categories (90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recent90 = transactions.filter(
    (t) => t.transaction_date >= ninetyDaysAgo.toISOString().slice(0, 10),
  );
  const catMap = new Map<string, number>();
  for (const r of recent90) {
    if (r.transaction_type !== "expense") continue;
    const k = r.category || "Uncategorized";
    catMap.set(k, (catMap.get(k) || 0) + Number(r.amount));
  }
  const topCategories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  // Top merchants (90 days)
  const merchantMap = new Map<string, number>();
  for (const r of recent90) {
    if (r.transaction_type !== "expense") continue;
    const k = r.merchant_name || "—";
    merchantMap.set(k, (merchantMap.get(k) || 0) + Number(r.amount));
  }
  const topMerchants = Array.from(merchantMap.entries())
    .filter(([k]) => k !== "—")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

  return (
    <>
      <TopBar title="Analitik" subtitle="Tren dan wawasan dari transaksi Anda" />

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full space-y-6 p-6 md:p-8">
        {/* KPI strip — 12-month summary */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <StatCard
              label="Pemasukan"
              value={formatCurrency(totalIncome, currency)}
              icon="trending_up"
              tone="secondary"
              spark={{ values: trend.income, color: "#0d9488" }}
              caption="12 bulan terakhir"
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <StatCard
              label="Pengeluaran"
              value={formatCurrency(totalExpense, currency)}
              icon="trending_down"
              tone="tertiary"
              spark={{ values: trend.expense, color: "#d97706" }}
              caption="12 bulan terakhir"
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <StatCard
              label="Tabungan Bersih"
              value={formatCurrency(net, currency)}
              icon="account_balance"
              tone={net >= 0 ? "primary" : "error"}
              spark={{ values: netSeries, color: net >= 0 ? "#3755c3" : "#ba1a1a" }}
              caption="12 bulan terakhir"
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <StatCard
              label="Rasio Tabungan"
              value={`${savingsRate.toFixed(0)}%`}
              icon="savings"
              tone="secondary"
              caption="Net dibagi pemasukan"
            />
          </div>
        </div>

        {insights.length > 0 ? (
          <Card className="animate-fade-up">
            <CardHeader title="Wawasan" subtitle="Terdeteksi otomatis dari data Anda" />
            <InsightsList insights={insights} />
          </Card>
        ) : null}

        <TrendChart
          labels={trend.labels}
          income={trend.income}
          expense={trend.expense}
          currency={currency}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="animate-fade-up">
            <CardHeader title="Kategori Teratas" subtitle="90 hari terakhir" />
            <HorizontalBars rows={topCategories} currency={currency} />
          </Card>
          <Card className="animate-fade-up">
            <CardHeader title="Merchant Teratas" subtitle="90 hari terakhir" />
            <HorizontalBars rows={topMerchants} currency={currency} />
          </Card>
        </div>

        <Card className="animate-fade-up">
          <CardHeader
            title="Pengeluaran per Hari"
            subtitle={
              busiestDow
                ? `Total per hari dalam seminggu · paling boros: ${busiestDow}`
                : "Total per hari dalam seminggu (12 bulan terakhir)"
            }
          />
          <VerticalBars labels={DOW_SHORT} values={dow} currency={currency} />
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Transaksi Berulang"
            subtitle="Merchant yang Anda bayar rutin (≥3×, nominal stabil)"
          />
          <RecurringList items={recurring} currency={currency} />
        </Card>
      </div>
    </>
  );
}
