"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";

export interface ParsedTransaction {
  transaction_type: "income" | "expense";
  amount: number;
  currency: string;
  transaction_date: string;
  merchant_name: string | null;
  item_name: string | null;
  category: string | null;
  payment_method: string | null;
  notes: string | null;
}

interface Props {
  data: ParsedTransaction;
  /** Persisted "already saved" state — survives reload, prevents re-saving. */
  saved?: boolean;
  savedId?: string | null;
  onConfirm: () => Promise<void>;
  onDiscard: () => void;
}

export function TransactionPreviewCard({ data, saved, savedId, onConfirm, onDiscard }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isExpense = data.transaction_type === "expense";
  const displayDate = data.transaction_date || new Date().toISOString().slice(0, 10);

  async function handleConfirm() {
    if (saved || status === "saving") return;
    setStatus("saving");
    setErrorMsg(null);
    try {
      await onConfirm();
      // Parent flips `saved` to true on success → this card re-renders saved.
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menyimpan");
      setStatus("error");
    }
  }

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border p-4 shadow-card transition-colors",
        saved
          ? "border-secondary/40 bg-secondary-container/15"
          : isExpense
            ? "border-error/30 bg-error-container/10"
            : "border-secondary/30 bg-secondary-container/10",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-full",
            isExpense
              ? "bg-error-container text-on-error-container"
              : "bg-secondary-container text-on-secondary-container",
          )}
        >
          <Icon name={isExpense ? "trending_down" : "trending_up"} filled />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-caps uppercase tracking-wider text-outline">
            {isExpense ? "Pengeluaran" : "Pemasukan"}
          </p>
          <p
            className={cn(
              "font-h2 text-h2 tabular",
              isExpense ? "text-error" : "text-secondary",
            )}
          >
            {isExpense ? "−" : "+"}
            {formatCurrency(data.amount, data.currency)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-body-sm">
        {data.merchant_name && (
          <>
            <dt className="text-outline">Merchant</dt>
            <dd className="font-medium text-on-surface">{data.merchant_name}</dd>
          </>
        )}
        {data.item_name && (
          <>
            <dt className="text-outline">Item</dt>
            <dd className="text-on-surface">{data.item_name}</dd>
          </>
        )}
        {data.category && (
          <>
            <dt className="text-outline">Kategori</dt>
            <dd className="text-on-surface">{data.category}</dd>
          </>
        )}
        {data.payment_method && (
          <>
            <dt className="text-outline">Pembayaran</dt>
            <dd className="text-on-surface">{data.payment_method}</dd>
          </>
        )}
        <dt className="text-outline">Tanggal</dt>
        <dd className="text-on-surface">{displayDate}</dd>
        {data.notes && (
          <>
            <dt className="text-outline">Catatan</dt>
            <dd className="text-on-surface">{data.notes}</dd>
          </>
        )}
      </dl>

      {saved ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-secondary/20 pt-3">
          <span className="flex items-center gap-2 text-body-sm font-semibold text-secondary">
            <Icon name="check_circle" filled />
            Tersimpan ke transaksi
          </span>
          <Link
            href={savedId ? `/transactions/${savedId}` : "/transactions"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/12 px-3 py-1.5 text-body-sm font-semibold text-secondary transition-colors hover:bg-secondary/20"
          >
            <Icon name="open_in_new" className="text-[18px]" />
            Lihat transaksi
          </Link>
        </div>
      ) : (
        <>
          {status === "error" && errorMsg && (
            <p className="text-body-sm text-error">{errorMsg}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="primary" onClick={handleConfirm} disabled={status === "saving"}>
              <Icon
                name={status === "saving" ? "progress_activity" : "check"}
                className={cn(status === "saving" && "animate-spin")}
              />
              {status === "saving" ? "Menyimpan…" : "Konfirmasi"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={status === "saving"}>
              <Icon name="close" />
              Abaikan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
