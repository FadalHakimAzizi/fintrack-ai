"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { createTransaction } from "@/app/(dashboard)/transactions/actions";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

type CategoryLite = Pick<Category, "id" | "name" | "kind">;

export function TransactionForm({
  categories,
  defaultCurrency,
}: {
  categories: CategoryLite[];
  defaultCurrency: string;
}) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const filteredCategories = categories.filter((c) => c.kind === type);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await createTransaction(formData);
    setSubmitting(false);
    if (result && !result.ok) setError(result.error || "Gagal menyimpan");
  }

  return (
    <form action={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card className="animate-fade-up">
        <CardHeader icon="receipt_long" title="Detail Transaksi" subtitle="Catat pemasukan atau pengeluaran baru" />

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
                {defaultCurrency === "IDR" ? "Rp" : "$"}
              </div>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0" className="pl-10 tabular" />
            </div>
          </div>
          <div>
            <Label htmlFor="transaction_date">Tanggal</Label>
            <Input id="transaction_date" name="transaction_date" type="date" defaultValue={today} required />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="merchant_name">Merchant / Penerima</Label>
            <Input id="merchant_name" name="merchant_name" type="text" placeholder="mis. Indomaret, Gojek" />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select id="category" name="category" defaultValue="">
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
            <Input id="item_name" name="item_name" type="text" placeholder="mis. Makan siang, Langganan" />
          </div>
          <div>
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select id="payment_method" name="payment_method" defaultValue="">
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
          <Textarea id="notes" name="notes" rows={3} placeholder="Detail opsional tentang transaksi ini…" />
        </div>

        {/* Advanced fields — collapsed by default */}
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
            <Input id="currency" name="currency" type="text" defaultValue={defaultCurrency} maxLength={3} className="uppercase" />
          </div>
          <div>
            <Label htmlFor="invoice_number">No. Invoice</Label>
            <Input id="invoice_number" name="invoice_number" type="text" />
          </div>
          <div>
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" name="location" type="text" />
          </div>
          <div>
            <Label htmlFor="tags">Tag (pisah dengan koma)</Label>
            <Input id="tags" name="tags" type="text" placeholder="kerja, jalan-jalan" />
          </div>
        </div>

        <RecurringBox isRecurring={isRecurring} setIsRecurring={setIsRecurring} />
      </Card>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link href="/transactions">
          <Button type="button" variant="ghost">Batal</Button>
        </Link>
        <Button type="submit" variant="primary" disabled={submitting}>
          <Icon name={submitting ? "progress_activity" : "check"} className={submitting ? "animate-spin" : ""} />
          {submitting ? "Menyimpan…" : "Simpan Transaksi"}
        </Button>
      </div>
    </form>
  );
}

export function TypeToggle({
  type,
  setType,
}: {
  type: "expense" | "income";
  setType: (t: "expense" | "income") => void;
}) {
  return (
    <div className="flex w-full max-w-sm rounded-xl bg-surface-container p-1">
      {(["expense", "income"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setType(tab)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-body-md font-medium transition-colors",
            type === tab
              ? tab === "expense"
                ? "bg-surface-container-lowest text-error shadow-sm"
                : "bg-surface-container-lowest text-secondary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          <Icon name={tab === "expense" ? "trending_down" : "trending_up"} className="text-[18px]" />
          {tab === "expense" ? "Pengeluaran" : "Pemasukan"}
        </button>
      ))}
    </div>
  );
}

export function RecurringBox({
  isRecurring,
  setIsRecurring,
  defaultPeriod = "monthly",
}: {
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  defaultPeriod?: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          id="recurring_flag"
          name="recurring_flag"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <Icon name="autorenew" filled className="text-[18px]" />
        </span>
        <span className="flex-1">
          <span className="block font-medium text-on-surface">Transaksi berulang</span>
          <span className="block text-body-sm text-on-surface-variant">Tandai jika berulang tiap periode</span>
        </span>
      </label>
      {isRecurring ? (
        <div className="mt-3 sm:max-w-xs">
          <Select id="recurring_period" name="recurring_period" defaultValue={defaultPeriod}>
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
