import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetRow } from "@/components/budgets/budget-row";
import {
  computeBudgetProgress,
  currentMonthISO,
  monthInputValue,
  type Budget,
} from "@/lib/budgets";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const supabase = createClient();

  const targetMonthISO =
    searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)
      ? searchParams.month + "-01"
      : currentMonthISO();

  const [{ data: budgetsData }, { data: txData }, { data: categoriesData }, { data: profile }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("month", targetMonthISO)
        .order("category"),
      supabase
        .from("transactions")
        .select("*")
        .gte("transaction_date", targetMonthISO)
        .order("transaction_date", { ascending: false }),
      supabase.from("categories").select("name, kind").eq("kind", "expense").order("name"),
      supabase.from("profiles").select("currency").single(),
    ]);

  const budgets = (budgetsData || []) as Budget[];
  const transactions = (txData || []) as Transaction[];
  const currency = profile?.currency || "IDR";
  const expenseCategories = Array.from(
    new Set((categoriesData || []).map((c) => c.name)),
  );

  const progress = computeBudgetProgress(budgets, transactions);
  const overBudget = progress.filter((p) => p.status === "over");
  const warning = progress.filter((p) => p.status === "warning");

  return (
    <>
      <TopBar title="Budgets" subtitle="Set monthly targets per category" />

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full space-y-6">
        {overBudget.length > 0 ? (
          <div className="p-4 rounded-lg bg-error-container text-on-error-container flex items-start gap-3">
            <Icon name="warning" filled />
            <div>
              <div className="font-semibold">
                {overBudget.length} kategori sudah melebihi budget bulan ini
              </div>
              <div className="text-body-sm opacity-80">
                {overBudget.map((p) => p.budget.category).join(", ")}
              </div>
            </div>
          </div>
        ) : null}
        {warning.length > 0 ? (
          <div className="p-4 rounded-lg bg-tertiary-container/20 text-tertiary flex items-start gap-3">
            <Icon name="info" filled />
            <div>
              <div className="font-semibold">
                {warning.length} kategori mendekati limit (≥80%)
              </div>
              <div className="text-body-sm opacity-80">
                {warning.map((p) => p.budget.category).join(", ")}
              </div>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader
            title="Add or Update Budget"
            subtitle="Setting the same category+month will overwrite the previous target"
          />
          <BudgetForm
            categories={expenseCategories}
            defaultCurrency={currency}
            defaultMonth={monthInputValue(targetMonthISO)}
          />
        </Card>

        <Card>
          <CardHeader
            title="Current Month"
            subtitle={new Date(targetMonthISO + "T00:00:00").toLocaleDateString(
              "id-ID",
              { month: "long", year: "numeric" },
            )}
            action={
              <form method="GET" className="flex items-center gap-2">
                <input
                  type="month"
                  name="month"
                  defaultValue={monthInputValue(targetMonthISO)}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg text-body-sm"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 border border-outline-variant rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  Load
                </button>
              </form>
            }
          />
          {progress.length === 0 ? (
            <div className="py-12 text-center">
              <Icon name="savings" className="text-outline" />
              <p className="text-body-md text-on-surface mt-2 mb-1">
                Belum ada budget bulan ini
              </p>
              <p className="text-body-sm text-outline">
                Klik <span className="font-semibold">New Budget</span> di atas untuk mulai.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((p) => (
                <BudgetRow key={p.budget.id} p={p} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
