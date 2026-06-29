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
        Anggaran Baru
      </Button>
    );
  }

  return (
    <form id="budget-form" action={onSubmit} className="space-y-4">
      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">
          <Icon name="error" filled />
          {error}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="b-category">Kategori</Label>
          <Select id="b-category" name="category" defaultValue="" required>
            <option value="" disabled>
              Pilih kategori…
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="b-month">Bulan</Label>
          <Input id="b-month" name="month" type="month" defaultValue={defaultMonth} required />
        </div>
        <div>
          <Label htmlFor="b-amount">Target (jumlah)</Label>
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
        <Label htmlFor="b-notes">Catatan (opsional)</Label>
        <Textarea id="b-notes" name="notes" rows={2} />
      </div>
      <input type="hidden" name="currency" value={defaultCurrency} />
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Batal
        </Button>
        <Button type="submit" variant="secondary" disabled={submitting}>
          <Icon name={submitting ? "progress_activity" : "save"} className={submitting ? "animate-spin" : ""} />
          {submitting ? "Menyimpan…" : "Simpan Anggaran"}
        </Button>
      </div>
    </form>
  );
}
