"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ReceiptUploader } from "@/components/transactions/receipt-uploader";
import { createTransaction } from "@/app/(dashboard)/transactions/actions";
import { cn } from "@/lib/utils";
import type { Category, Account } from "@/lib/types";

type CategoryLite = Pick<Category, "id" | "name" | "kind">;
type AccountLite = Pick<Account, "id" | "name" | "kind">;

export function TransactionForm({
  categories,
  accounts,
  defaultCurrency,
}: {
  categories: CategoryLite[];
  accounts: AccountLite[];
  defaultCurrency: string;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<{ path: string; url: string } | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);

  const filteredCategories = categories.filter((c) => c.kind === type);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    if (attachment) {
      formData.set("attachment_path", attachment.path);
      formData.set("attachment_url", attachment.url);
    }
    const result = await createTransaction(formData);
    setSubmitting(false);
    if (result && !result.ok) setError(result.error || "Failed to save");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={onSubmit} className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader title="Transaction Details" />

        {error ? (
          <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
            {error}
          </div>
        ) : null}

        <div className="flex p-1 bg-surface-container rounded-lg w-full max-w-sm mb-6">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={cn(
              "flex-1 py-2 text-center text-body-md font-medium rounded-md transition-colors",
              type === "expense"
                ? "bg-surface-container-lowest shadow-sm text-on-surface"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={cn(
              "flex-1 py-2 text-center text-body-md font-medium rounded-md transition-colors",
              type === "income"
                ? "bg-surface-container-lowest shadow-sm text-on-surface"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            Income
          </button>
        </div>
        <input type="hidden" name="transaction_type" value={type} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant font-numeric">
                {defaultCurrency === "IDR" ? "Rp" : "$"}
              </div>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0"
                className="pl-10 tabular"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="transaction_date">Date</Label>
            <Input
              id="transaction_date"
              name="transaction_date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="merchant_name">Merchant / Payee</Label>
            <Input
              id="merchant_name"
              name="merchant_name"
              type="text"
              placeholder="e.g. Indomaret, Gojek"
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue="">
              <option value="">Select category...</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="item_name">Item (optional)</Label>
            <Input
              id="item_name"
              name="item_name"
              type="text"
              placeholder="e.g. Lunch, Monthly subscription"
            />
          </div>
          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select id="payment_method" name="payment_method" defaultValue="">
              <option value="">Select...</option>
              <option value="cash">Cash</option>
              <option value="debit">Debit Card</option>
              <option value="credit">Credit Card</option>
              <option value="transfer">Bank Transfer</option>
              <option value="qris">QRIS</option>
              <option value="ewallet">E-Wallet</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="account_name">Account</Label>
            <Select id="account_name" name="account_name" defaultValue="">
              <option value="">Select account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              type="text"
              defaultValue={defaultCurrency}
              maxLength={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <Label htmlFor="invoice_number">Invoice #</Label>
            <Input id="invoice_number" name="invoice_number" type="text" />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" type="text" />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" type="text" placeholder="work, travel" />
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="notes">Description / Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional details about this transaction..."
          />
        </div>

        <div className="mt-6 flex items-start gap-4 p-4 rounded-lg bg-surface-container border border-outline-variant/50">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="checkbox"
              id="recurring_flag"
              name="recurring_flag"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <Label htmlFor="recurring_flag" className="mb-0 cursor-pointer">
              Recurring transaction
            </Label>
          </div>
          {isRecurring && (
            <div className="flex-1">
              <Label htmlFor="recurring_period" className="sr-only">Period</Label>
              <Select id="recurring_period" name="recurring_period" defaultValue="monthly">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-h3 font-h3 text-on-surface mb-4">Receipt / Invoice</h3>
        <ReceiptUploader onUploaded={setAttachment} />
      </Card>

      <div className="flex items-center justify-end gap-4 pt-2">
        <Link href="/transactions">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </Link>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </form>
  );
}
