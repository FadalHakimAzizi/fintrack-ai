"use client";

import { useState } from "react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { upsertBudget } from "@/app/(dashboard)/budgets/actions";

interface Props {
  categories: string[];
  defaultCurrency: string;
  defaultMonth: string; // YYYY-MM
}

export function BudgetForm({ categories, defaultCurrency, defaultMonth }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await upsertBudget(formData);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setOpen(false);
      (document.getElementById("budget-form") as HTMLFormElement | null)?.reset();
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Icon name="add" />
        New Budget
      </Button>
    );
  }

  return (
    <form id="budget-form" action={onSubmit} className="space-y-4">
      {error ? (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="b-category">Category</Label>
          <Select id="b-category" name="category" defaultValue="" required>
            <option value="" disabled>
              Select category...
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="b-month">Month</Label>
          <Input
            id="b-month"
            name="month"
            type="month"
            defaultValue={defaultMonth}
            required
          />
        </div>
        <div>
          <Label htmlFor="b-amount">Target Amount</Label>
          <Input
            id="b-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="500000"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="b-notes">Notes (optional)</Label>
        <Textarea id="b-notes" name="notes" rows={2} />
      </div>
      <input type="hidden" name="currency" value={defaultCurrency} />
      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Saving..." : "Save Budget"}
        </Button>
      </div>
    </form>
  );
}
