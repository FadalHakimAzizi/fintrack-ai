import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const SOURCE_ICON: Record<string, string> = {
  website: "language",
  telegram: "send",
  gmail: "mail",
  ocr: "document_scanner",
  api: "api",
};

// Recognizable per-category icon so long lists are easier to scan and livelier.
const CATEGORY_ICON: Record<string, string> = {
  Groceries: "shopping_cart",
  Dining: "restaurant",
  Transportation: "directions_car",
  Utilities: "bolt",
  Entertainment: "sports_esports",
  Shopping: "shopping_bag",
  Health: "medical_services",
  Salary: "payments",
  Freelance: "work",
  Investment: "trending_up",
  Other: "category",
};

export function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.transaction_type === "income";
  const iconName =
    (tx.category && CATEGORY_ICON[tx.category]) ||
    (isIncome ? "trending_up" : "shopping_bag");
  return (
    <Link
      href={`/transactions/${tx.id}`}
      className="group flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 rounded-xl border border-transparent hover:border-outline-variant/40 hover:bg-surface-container-low hover:shadow-xs transition-all"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl grid place-items-center shrink-0 ring-1 ring-inset transition-transform group-hover:scale-105",
          isIncome
            ? "bg-secondary-container text-on-secondary-container ring-secondary/20"
            : "bg-primary-container/15 text-primary ring-primary/15",
        )}
      >
        <Icon name={iconName} filled />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-body-md text-on-surface font-medium truncate flex items-center gap-2">
          {tx.merchant_name || tx.item_name || "Untitled"}
          {tx.recurring_flag && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-label-caps shrink-0">
              <Icon name="autorenew" />
              {tx.recurring_period || "recurring"}
            </span>
          )}
        </div>
        <div className="text-body-sm text-outline flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{tx.category || "Uncategorized"}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(tx.transaction_date)}</span>
          <span aria-hidden className="hidden sm:inline">·</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Icon name={SOURCE_ICON[tx.source_channel] || "label"} />
            {tx.source_channel}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "text-body-md font-semibold tabular shrink-0",
          isIncome ? "text-secondary" : "text-on-surface",
        )}
      >
        {isIncome ? "+" : "-"}
        {formatCurrency(tx.amount, tx.currency)}
      </div>
      <Icon
        name="chevron_right"
        className="-mr-1 shrink-0 text-outline opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </Link>
  );
}
