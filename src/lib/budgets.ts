import type { Transaction } from "@/lib/types";

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  currency: string;
  month: string; // YYYY-MM-DD (first of month)
  notes: string | null;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number;
  status: "safe" | "warning" | "over";
}

export function computeBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetProgress[] {
  return budgets.map((b) => {
    const monthStart = b.month.slice(0, 10); // YYYY-MM-DD
    const next = new Date(monthStart + "T00:00:00");
    next.setMonth(next.getMonth() + 1);
    const nextISO = next.toISOString().slice(0, 10);

    const spent = transactions
      .filter(
        (t) =>
          t.transaction_type === "expense" &&
          t.category === b.category &&
          t.transaction_date >= monthStart &&
          t.transaction_date < nextISO,
      )
      .reduce((s, t) => s + Number(t.amount), 0);

    const amount = Number(b.amount);
    const percent = amount > 0 ? (spent / amount) * 100 : 0;
    const remaining = amount - spent;
    const status: BudgetProgress["status"] =
      percent >= 100 ? "over" : percent >= 80 ? "warning" : "safe";

    return { budget: b, spent, remaining, percent, status };
  });
}

export function currentMonthISO(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function monthInputValue(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM for <input type="month">
}
