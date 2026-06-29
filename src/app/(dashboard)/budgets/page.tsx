import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetRow } from "@/components/budgets/budget-row";
import { BudgetOverview } from "@/components/budgets/budget-overview";
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

  const totalBudget = progress.reduce((s, p) => s + Number(p.budget.amount), 0);
  const totalSpent = progress.reduce((s, p) => s + p.spent, 0);
  const monthLabel = new Date(targetMonthISO + "T00:00:00").toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const monthInput = monthInputValue(targetMonthISO);
  const prevD = new Date(targetMonthISO + "T00:00:00");
  prevD.setMonth(prevD.getMonth() - 1);
  const nextD = new Date(targetMonthISO + "T00:00:00");
  nextD.setMonth(nextD.getMonth() + 1);
  const prevMonth = prevD.toISOString().slice(0, 7);
  const nextMonth = nextD.toISOString().slice(0, 7);

  return (
    <>
      <TopBar title="Anggaran" subtitle="Atur target bulanan per kategori" />

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full space-y-6 p-6 md:p-8">
        {progress.length > 0 ? (
          <BudgetOverview
            totalBudget={totalBudget}
            totalSpent={totalSpent}
            monthLabel={monthLabel}
            currency={currency}
            count={progress.length}
            overCount={overBudget.length}
            warnCount={warning.length}
          />
        ) : null}

        {overBudget.length > 0 ? (
          <div className="animate-fade-up flex items-start gap-3 rounded-xl bg-error-container p-4 text-on-error-container">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error/20">
              <Icon name="warning" filled />
            </span>
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
          <div className="animate-fade-up flex items-start gap-3 rounded-xl bg-tertiary-container/20 p-4 text-tertiary">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tertiary/15">
              <Icon name="info" filled />
            </span>
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

        <Card className="animate-fade-up">
          <CardHeader
            title="Tambah atau Perbarui Anggaran"
            subtitle="Mengatur kategori+bulan yang sama akan menimpa target sebelumnya"
          />
          <BudgetForm
            categories={expenseCategories}
            defaultCurrency={currency}
            defaultMonth={monthInput}
          />
        </Card>

        <Card className="animate-fade-up">
          <CardHeader
            title="Rincian Anggaran"
            subtitle={monthLabel}
            action={
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/budgets?month=${prevMonth}`}
                  aria-label="Bulan sebelumnya"
                  title="Bulan sebelumnya"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-outline/30 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <Icon name="chevron_left" />
                </Link>
                <form method="GET" className="flex items-center gap-1.5">
                  <input
                    type="month"
                    name="month"
                    defaultValue={monthInput}
                    className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface focus-ring"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-outline/30 bg-surface-container-low px-3 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    <Icon name="event" className="text-[18px]" />
                    Lihat
                  </button>
                </form>
                <Link
                  href={`/budgets?month=${nextMonth}`}
                  aria-label="Bulan berikutnya"
                  title="Bulan berikutnya"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-outline/30 bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <Icon name="chevron_right" />
                </Link>
              </div>
            }
          />
          {progress.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-container">
                <Icon name="savings" className="text-outline" />
              </div>
              <p className="text-body-md font-medium text-on-surface">Belum ada budget bulan ini</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Klik <span className="font-semibold text-primary">Anggaran Baru</span> di atas untuk mulai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
