import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { LineChart, LineChartLegend } from "@/components/charts/line-chart";
import { HorizontalBars, VerticalBars } from "@/components/charts/bar-chart";
import { InsightsList } from "@/components/dashboard/insights-list";
import {
  computeInsights,
  detectRecurring,
  dayOfWeekPattern,
  monthlyTrend,
} from "@/lib/insights";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);

  const { data: rows } = await supabase
    .from("transactions")
    .select("*")
    .gte("transaction_date", sixMonthsAgo.toISOString().slice(0, 10))
    .order("transaction_date", { ascending: false });

  const { data: profile } = await supabase.from("profiles").select("currency").single();
  const currency = profile?.currency || "IDR";

  const transactions = (rows || []) as Transaction[];
  const insights = computeInsights(transactions, { currency });
  const trend = monthlyTrend(transactions, 6);
  const dow = dayOfWeekPattern(transactions);
  const recurring = detectRecurring(transactions);

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

  const dowLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <TopBar title="Analytics" subtitle="Trends and insights from your transactions" />

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full space-y-6">
        {insights.length > 0 ? (
          <Card>
            <CardHeader title="Insights" subtitle="Auto-detected from your data" />
            <InsightsList insights={insights} />
          </Card>
        ) : null}

        <Card>
          <CardHeader
            title="6-Month Trend"
            subtitle="Income vs expense per month"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Top Categories" subtitle="Last 90 days" />
            <HorizontalBars rows={topCategories} currency={currency} />
          </Card>
          <Card>
            <CardHeader title="Top Merchants" subtitle="Last 90 days" />
            <HorizontalBars rows={topMerchants} currency={currency} />
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Spending by Day of Week"
            subtitle="All expenses in the last 6 months"
          />
          <VerticalBars labels={dowLabels} values={dow} currency={currency} />
        </Card>

        <Card>
          <CardHeader
            title="Recurring Transactions"
            subtitle="Merchants you pay regularly (≥3 times, stable amount)"
          />
          {recurring.length === 0 ? (
            <div className="py-8 text-center text-body-sm text-outline">
              No recurring pattern detected yet. Keep logging — we check for ≥3
              similar-amount transactions per merchant.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {recurring.map((r) => (
                <div
                  key={r.merchant}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container grid place-items-center shrink-0">
                      <Icon name="repeat" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-body-md text-on-surface font-medium truncate">
                        {r.merchant}
                      </div>
                      <div className="text-body-sm text-outline">
                        {r.category || "Uncategorized"} · {r.occurrences}×
                        <span className="mx-1">·</span>
                        last {formatDate(r.lastSeen)}
                      </div>
                    </div>
                  </div>
                  <div className="text-body-md font-semibold tabular shrink-0">
                    ~{formatCurrency(Math.round(r.averageAmount), r.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
