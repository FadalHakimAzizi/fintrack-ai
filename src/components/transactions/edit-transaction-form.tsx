"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TypeToggle, RecurringBox } from "@/components/transactions/transaction-form";
import { updateTransaction } from "@/app/(dashboard)/transactions/actions";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/lib/types";

type CategoryLite = Pick<Category, "id" | "name" | "kind">;

export function EditTransactionForm({
  tx,
  categories,
  defaultCurrency,
}: {
  tx: Transaction;
  categories: CategoryLite[];
  defaultCurrency: string;
}) {
  const [type, setType] = useState<"expense" | "income">(tx.transaction_type);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(tx.recurring_flag);
  const hasAdvanced = Boolean(
    tx.invoice_number || tx.location || (tx.tags && tx.tags.length) || (tx.currency && tx.currency !== defaultCurrency),
  );
  const [showMore, setShowMore] = useState(hasAdvanced);

  const filteredCategories = categories.filter((c) => c.kind === type);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await updateTransaction(tx.id, formData);
    setSubmitting(false);
    if (result && !result.ok) setError(result.error || "Gagal menyimpan");
  }

  return (
    <form action={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card className="animate-fade-up">
        <CardHeader icon="edit" title="Edit Transaksi" subtitle="Perbarui detail transaksi ini" />

        {error ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">
            <Icon name="error" filled />
            {error}
          </div>
        ) : null}

        <TypeToggle type={type} setType={setType} />
        <input type="hidden" name="transaction_type" value={type} />

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="amount">Jumlah</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-numeric text-on-surface-variant">
                {(tx.currency || defaultCurrency) === "IDR" ? "Rp" : "$"}
              </div>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" required defaultValue={tx.amount} className="pl-10 tabular" />
            </div>
          </div>
          <div>
            <Label htmlFor="transaction_date">Tanggal</Label>
            <Input id="transaction_date" name="transaction_date" type="date" required defaultValue={tx.transaction_date} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="merchant_name">Merchant / Penerima</Label>
            <Input id="merchant_name" name="merchant_name" type="text" defaultValue={tx.merchant_name || ""} placeholder="mis. Indomaret, Gojek" />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select id="category" name="category" defaultValue={tx.category || ""}>
              <option value="">Pilih kategori…</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="item_name">Item (opsional)</Label>
            <Input id="item_name" name="item_name" type="text" defaultValue={tx.item_name || ""} />
          </div>
          <div>
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select id="payment_method" name="payment_method" defaultValue={tx.payment_method || ""}>
              <option value="">Pilih…</option>
              <option value="cash">Tunai</option>
              <option value="debit">Kartu Debit</option>
              <option value="credit">Kartu Kredit</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
              <option value="ewallet">E-Wallet</option>
            </Select>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="notes">Deskripsi / Catatan</Label>
          <Textarea id="notes" name="notes" rows={3} defaultValue={tx.notes || ""} />
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="mt-6 inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
        >
          <Icon name={showMore ? "expand_less" : "expand_more"} />
          Detail tambahan
        </button>

        <div className={cn("mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2", !showMore && "hidden")}>
          <div>
            <Label htmlFor="currency">Mata Uang</Label>
            <Input id="currency" name="currency" type="text" defaultValue={tx.currency || defaultCurrency} maxLength={3} className="uppercase" />
          </div>
          <div>
            <Label htmlFor="invoice_number">No. Invoice</Label>
            <Input id="invoice_number" name="invoice_number" type="text" defaultValue={tx.invoice_number || ""} />
          </div>
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" name="location" type="text" defaultValue={tx.location || ""} />
          </div>
          <div>
            <Label htmlFor="tags">Tag (pisah dengan koma)</Label>
            <Input id="tags" name="tags" type="text" defaultValue={tx.tags?.join(", ") || ""} placeholder="kerja, jalan-jalan" />
          </div>
        </div>

        <RecurringBox
          isRecurring={isRecurring}
          setIsRecurring={setIsRecurring}
          defaultPeriod={tx.recurring_period || "monthly"}
        />
      </Card>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link href={`/transactions/${tx.id}`}>
          <Button type="button" variant="ghost">Batal</Button>
        </Link>
        <Button type="submit" variant="primary" disabled={submitting}>
          <Icon name={submitting ? "progress_activity" : "save"} className={submitting ? "animate-spin" : ""} />
          {submitting ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
      </div>
    </form>
  );
}
