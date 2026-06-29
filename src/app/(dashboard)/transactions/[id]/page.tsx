import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { deleteTransaction } from "@/app/(dashboard)/transactions/actions";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

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

const SOURCE_ICON: Record<string, string> = {
  website: "language",
  telegram: "send",
  gmail: "mail",
  ocr: "document_scanner",
  api: "api",
};

export default async function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!tx) notFound();
  const t = tx as Transaction;

  let signedUrl: string | null = null;
  if (t.attachment_path) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrl(t.attachment_path, 60 * 30);
    signedUrl = signed?.signedUrl || null;
  }
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(t.attachment_path || "");

  async function handleDelete() {
    "use server";
    await deleteTransaction(params.id);
  }

  const isIncome = t.transaction_type === "income";
  const icon =
    (t.category && CATEGORY_ICON[t.category]) || (isIncome ? "trending_up" : "shopping_bag");

  return (
    <>
      <TopBar
        title={t.merchant_name || t.item_name || "Transaksi"}
        subtitle={`${isIncome ? "Pemasukan" : "Pengeluaran"} · ${formatDate(t.transaction_date)}`}
        action={
          <div className="flex items-center gap-1.5">
            <Link href="/transactions">
              <Button size="sm" variant="ghost">
                <Icon name="arrow_back" />
                <span className="hidden sm:inline">Kembali</span>
              </Button>
            </Link>
            <Link href={`/transactions/${params.id}/edit`}>
              <Button size="sm" variant="ghost">
                <Icon name="edit" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </Link>
            <form action={handleDelete}>
              <Button size="sm" variant="danger" type="submit">
                <Icon name="delete" />
                <span className="hidden sm:inline">Hapus</span>
              </Button>
            </form>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Hero */}
          <Card className="animate-fade-up surface-sheen relative overflow-hidden">
            <div
              className={cn(
                "pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full blur-3xl",
                isIncome ? "bg-secondary/10" : "bg-tertiary/10",
              )}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-caps font-semibold uppercase tracking-wider",
                    isIncome ? "bg-secondary/15 text-secondary" : "bg-tertiary/15 text-tertiary",
                  )}
                >
                  <Icon name={isIncome ? "trending_up" : "trending_down"} className="text-[14px]" />
                  {isIncome ? "Pemasukan" : "Pengeluaran"}
                </span>
                <p
                  className={cn(
                    "mt-3 break-words font-display text-h1 leading-none tabular md:text-display",
                    isIncome ? "text-secondary" : "text-on-surface",
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(t.amount, t.currency)}
                </p>
                <p className="mt-3 text-body-md font-medium text-on-surface">
                  {t.merchant_name || t.item_name || "Tanpa nama"}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-body-sm text-on-surface-variant">
                  <Icon name="calendar_today" className="text-[16px]" />
                  {formatDate(t.transaction_date)}
                  <span>·</span>
                  <Icon name={SOURCE_ICON[t.source_channel] || "label"} className="text-[16px]" />
                  {t.source_channel}
                </p>
              </div>
              <div
                className={cn(
                  "grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ring-black/[0.04]",
                  isIncome ? "bg-secondary/12 text-secondary" : "bg-tertiary/12 text-tertiary",
                )}
              >
                <Icon name={icon} filled />
              </div>
            </div>
          </Card>

          {/* Detail */}
          <Card className="animate-fade-up">
            <CardHeader icon="list_alt" title="Detail" />
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field icon="storefront" label="Merchant" value={t.merchant_name} />
              <Field icon="category" label="Kategori" value={t.category} />
              <Field icon="label" label="Item" value={t.item_name} />
              <Field icon="payments" label="Metode bayar" value={t.payment_method} />
              <Field icon="attach_money" label="Mata uang" value={t.currency} />
              <Field icon="receipt" label="No. invoice" value={t.invoice_number} />
              <Field icon="location_on" label="Lokasi" value={t.location} />
              <Field
                icon="verified"
                label="Status"
                value={t.parsed_status}
              />
              <Field
                icon="speed"
                label="Confidence"
                value={t.confidence_score ? `${(t.confidence_score * 100).toFixed(0)}%` : null}
              />
              <Field
                icon="sell"
                label="Tag"
                value={t.tags && t.tags.length > 0 ? t.tags.join(", ") : null}
              />
            </dl>
            {t.notes ? (
              <div className="mt-5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-4">
                <div className="flex items-center gap-1.5 text-label-caps uppercase tracking-wider text-on-surface-variant">
                  <Icon name="notes" className="text-[16px]" />
                  Catatan
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-body-md text-on-surface">{t.notes}</p>
              </div>
            ) : null}
          </Card>

          {/* Attachment */}
          {signedUrl ? (
            <Card className="animate-fade-up">
              <CardHeader icon="receipt_long" title="Struk" />
              {isImage ? (
                <a href={signedUrl} target="_blank" rel="noreferrer" className="group block">
                  <img
                    src={signedUrl}
                    alt="Struk"
                    className="max-h-96 w-full rounded-xl border border-outline-variant/40 object-contain transition-opacity group-hover:opacity-90"
                  />
                  <span className="mt-2 inline-flex items-center gap-1.5 text-body-sm font-medium text-primary">
                    <Icon name="open_in_new" className="text-[18px]" />
                    Buka ukuran penuh
                  </span>
                </a>
              ) : (
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 font-semibold text-primary transition-colors hover:bg-primary/15"
                >
                  <Icon name="attachment" />
                  Buka lampiran
                </a>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Field({ icon, label, value }: { icon: string; label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-3">
      <dt className="flex items-center gap-1.5 text-label-caps uppercase tracking-wider text-on-surface-variant">
        <Icon name={icon} className="text-[16px]" />
        {label}
      </dt>
      <dd className={cn("mt-1 truncate", value ? "text-on-surface" : "text-outline")}>
        {value || "—"}
      </dd>
    </div>
  );
}
