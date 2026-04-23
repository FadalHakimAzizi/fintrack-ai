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

export function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.transaction_type === "income";
  return (
    <Link
      href={`/transactions/${tx.id}`}
      className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full grid place-items-center shrink-0",
          isIncome
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-primary-container/10 text-primary",
        )}
      >
        <Icon name={isIncome ? "trending_up" : "shopping_bag"} filled />
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
        <div className="text-body-sm text-outline flex items-center gap-2">
          <span>{tx.category || "Uncategorized"}</span>
          <span>·</span>
          <span>{formatDate(tx.transaction_date)}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
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
    </Link>
  );
}
