import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { CategoryBars } from "@/components/dashboard/category-bars";
import { InsightsList } from "@/components/dashboard/insights-list";
import { LineChart, LineChartLegend } from "@/components/charts/line-chart";
import { TxRow } from "@/components/transactions/tx-row";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";
import { computeInsights, monthlyTrend } from "@/lib/insights";
import { computeBudgetProgress, currentMonthISO, type Budget } from "@/lib/budgets";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("currency")
    .eq("id", user!.id)
    .single();
  const currency = profile?.currency || "IDR";

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);

  const [{ data: txRows }, { data: budgetsData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", sixMonthsAgo.toISOString().slice(0, 10))
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
  const trend = monthlyTrend(transactions, 6);
  const budgetProgress = computeBudgetProgress(budgets, transactions);
  const overBudget = budgetProgress.filter((p) => p.status === "over");
  const warning = budgetProgress.filter((p) => p.status === "warning");

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Monthly overview of your cash flow"
        action={
          <Link href="/transactions/new">
            <Button size="sm" variant="primary">
              <Icon name="add" />
              New Transaction
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full space-y-8">
        {overBudget.length + warning.length > 0 ? (
          <Link
            href="/budgets"
            className={`block p-4 rounded-lg flex items-start gap-3 transition-colors ${
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
          <StatCard
            label="Income (this month)"
            value={formatCurrency(income, currency)}
            icon="trending_up"
            tone="secondary"
          />
          <StatCard
            label="Expense (this month)"
            value={formatCurrency(expense, currency)}
            icon="trending_down"
            tone="tertiary"
          />
          <StatCard
            label="Net"
            value={formatCurrency(net, currency)}
            icon="account_balance"
            tone={net >= 0 ? "primary" : "error"}
          />
        </div>

        {insights.length > 0 ? (
          <Card>
            <CardHeader
              title="Insights"
              subtitle="Auto-detected from your recent transactions"
              action={
                <Link href="/ai" className="text-body-sm text-primary font-semibold">
                  Ask AI →
                </Link>
              }
            />
            <InsightsList insights={insights} />
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="6-Month Trend"
            subtitle="Income vs expense"
            action={
              <LineChartLegend
                series={[
                  { label: "Income", color: "#006c49", values: [] },
                  { label: "Expense", color: "#1e40af", values: [] },
                ]}
              />
            }
          />
          <LineChart
            labels={trend.labels}
            currency={currency}
            series={[
              { label: "Income", color: "#006c49", values: trend.income },
              { label: "Expense", color: "#1e40af", values: trend.expense },
            ]}
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent Transactions"
              subtitle="Your latest activity"
              action={
                <Link href="/transactions" className="text-body-sm text-primary font-semibold">
                  View all
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
                <p className="text-body-md text-on-surface mb-2">No transactions yet</p>
                <p className="text-body-sm text-outline mb-4">
                  Start by adding your first transaction.
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

          <Card>
            <CardHeader title="Top Categories" subtitle="Expense breakdown" />
            <CategoryBars rows={catRows} currency={currency} />
          </Card>
        </div>
      </div>
    </>
  );
}
