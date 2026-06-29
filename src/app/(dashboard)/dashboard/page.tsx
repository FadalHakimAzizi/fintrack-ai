import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { InsightsList } from "@/components/dashboard/insights-list";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { TxRow } from "@/components/transactions/tx-row";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";
import { computeInsights, monthlyTrend } from "@/lib/insights";
import { computeBudgetProgress, currentMonthISO, type Budget } from "@/lib/budgets";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

type Trend = { value: string; direction: "up" | "down"; good: boolean };

// Month-over-month delta as a labeled pill. `betterWhen` says which direction
// counts as "good" (income up is good; expenses down is good).
function momTrend(
  cur: number,
  prev: number,
  betterWhen: "up" | "down",
): Trend | undefined {
  if (!prev) return undefined;
  const delta = ((cur - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(delta) || Math.abs(delta) < 1) return undefined;
  const direction: "up" | "down" = delta >= 0 ? "up" : "down";
  return { value: `${Math.abs(delta).toFixed(0)}%`, direction, good: direction === betterWhen };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency, full_name")
    .eq("id", user!.id)
    .single();
  const currency = profile?.currency || "IDR";

  // Pull a full year so the dashboard can toggle between 6-month and 1-year trends.
  const yearAgo = new Date();
  yearAgo.setMonth(yearAgo.getMonth() - 12);
  yearAgo.setDate(1);

  const [{ data: txRows }, { data: budgetsData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", yearAgo.toISOString().slice(0, 10))
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("budgets")
      .select("*")
      .eq("month", currentMonthISO()),
  ]);

  const transactions = (txRows || []) as Transaction[];
  const budgets = (budgetsData || []) as Budget[];

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);
  const monthStartISO = firstOfMonth.toISOString().slice(0, 10);

  const monthTx = transactions.filter((t) => t.transaction_date >= monthStartISO);

  const income = monthTx
    .filter((t) => t.transaction_type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = monthTx
    .filter((t) => t.transaction_type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;

  const byCategory = new Map<string, number>();
  for (const t of monthTx) {
    if (t.transaction_type !== "expense") continue;
    const k = t.category || "Uncategorized";
    byCategory.set(k, (byCategory.get(k) || 0) + Number(t.amount));
  }
  const catRows = Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const recent = transactions.slice(0, 8);
  const insights = computeInsights(transactions, { currency });
  const trend = monthlyTrend(transactions, 12);
  const budgetProgress = computeBudgetProgress(budgets, transactions);
  const overBudget = budgetProgress.filter((p) => p.status === "over");
  const warning = budgetProgress.filter((p) => p.status === "warning");

  // Previous calendar month totals (second-to-last point in the 6-month trend)
  // drive the month-over-month pills on the stat cards.
  const prevIncome = trend.income.at(-2) ?? 0;
  const prevExpense = trend.expense.at(-2) ?? 0;
  const prevNet = prevIncome - prevExpense;
  const netSeries = trend.income.map((v, i) => v - trend.expense[i]);
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";
  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Prefer the saved full name; fall back to the email's local part.
  const fullName = (profile?.full_name || "").trim();
  const rawName = fullName || (user?.email?.split("@")[0] ?? "Teman");
  const displayName =
    rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[._-]+/g, " ");
  const initials =
    (fullName || rawName)
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <>
      <TopBar
        title="Dasbor"
        subtitle="Ringkasan arus kas bulanan Anda"
        action={
          <Link href="/transactions/new">
            <Button size="sm" variant="primary">
              <Icon name="add" />
              Transaksi Baru
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-container mx-auto w-full space-y-6 md:space-y-8">
        <BalanceHero
          greeting={greeting}
          name={displayName}
          initials={initials}
          dateLabel={dateLabel}
          monthLabel={monthLabel}
          net={net}
          income={income}
          expense={expense}
          savingsRate={savingsRate}
          currency={currency}
        />

        <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
          <QuickActions />
        </div>

        {overBudget.length + warning.length > 0 ? (
          <Link
            href="/budgets"
            className={`animate-fade-up block p-4 rounded-lg flex items-start gap-3 transition-colors ${
              overBudget.length > 0
                ? "bg-error-container text-on-error-container hover:opacity-90"
                : "bg-tertiary-container/20 text-tertiary hover:bg-tertiary-container/30"
            }`}
          >
            <Icon name={overBudget.length > 0 ? "warning" : "info"} filled />
            <div className="flex-1">
              <div className="font-semibold">
                {overBudget.length > 0
                  ? `${overBudget.length} kategori over budget`
                  : `${warning.length} kategori mendekati limit`}
              </div>
              <div className="text-body-sm opacity-80">
                {[...overBudget, ...warning].map((p) => p.budget.category).join(", ")}
                <span className="mx-1">·</span>
                Klik untuk lihat detail.
              </div>
            </div>
            <Icon name="arrow_forward" />
          </Link>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <StatCard
              label="Pemasukan (bulan ini)"
              value={formatCurrency(income, currency)}
              icon="trending_up"
              tone="secondary"
              trend={momTrend(income, prevIncome, "up")}
              spark={{ values: trend.income, color: "#0d9488" }}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <StatCard
              label="Pengeluaran (bulan ini)"
              value={formatCurrency(expense, currency)}
              icon="trending_down"
              tone="tertiary"
              trend={momTrend(expense, prevExpense, "down")}
              spark={{ values: trend.expense, color: "#d97706" }}
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
            <StatCard
              label="Net"
              value={formatCurrency(net, currency)}
              icon="account_balance"
              tone={net >= 0 ? "primary" : "error"}
              trend={momTrend(net, prevNet, "up")}
              spark={{ values: netSeries, color: net >= 0 ? "#3755c3" : "#ba1a1a" }}
            />
          </div>
        </div>

        {insights.length > 0 ? (
          <Card className="animate-fade-up">
            <CardHeader
              title="Wawasan"
              subtitle="Terdeteksi otomatis dari transaksi terbaru Anda"
              action={
                <Link href="/ai" className="text-body-sm text-primary font-semibold">
                  Tanya AI →
                </Link>
              }
            />
            <InsightsList insights={insights} />
          </Card>
        ) : null}

        <TrendChart
          labels={trend.labels}
          income={trend.income}
          expense={trend.expense}
          currency={currency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-fade-up lg:col-span-2">
            <CardHeader
              title="Transaksi Terbaru"
              subtitle="Aktivitas terbaru Anda"
              action={
                <Link href="/transactions" className="text-body-sm text-primary font-semibold">
                  Lihat semua
                </Link>
              }
            />
            {recent.length > 0 ? (
              <div className="space-y-1">
                {recent.map((t) => (
                  <TxRow key={t.id} tx={t} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container grid place-items-center">
                  <Icon name="receipt_long" />
                </div>
                <p className="text-body-md text-on-surface mb-2">Belum ada transaksi</p>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Mulai dengan menambahkan transaksi pertama Anda.
                </p>
                <Link href="/transactions/new">
                  <Button size="sm">
                    <Icon name="add" />
                    Add Transaction
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="animate-fade-up">
            <CardHeader title="Kategori Teratas" subtitle="Rincian pengeluaran bulan ini" />
            <CategoryDonut rows={catRows} currency={currency} />
          </Card>
        </div>
      </div>
    </>
  );
}
