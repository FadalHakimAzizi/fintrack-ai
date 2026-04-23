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

  async function handleDelete() {
    "use server";
    await deleteTransaction(params.id);
  }

  const isIncome = t.transaction_type === "income";

  return (
    <>
      <TopBar
        title={t.merchant_name || t.item_name || "Transaction"}
        subtitle={`${t.transaction_type} · ${formatDate(t.transaction_date)}`}
        action={
          <div className="flex items-center gap-2">
            <Link href="/transactions">
              <Button size="sm" variant="ghost">
                <Icon name="arrow_back" />
                Back
              </Button>
            </Link>
            <Link href={`/transactions/${params.id}/edit`}>
              <Button size="sm" variant="ghost">
                <Icon name="edit" />
                Edit
              </Button>
            </Link>
            <form action={handleDelete}>
              <Button size="sm" variant="danger" type="submit">
                <Icon name="delete" />
                Delete
              </Button>
            </form>
          </div>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-label-caps text-outline uppercase tracking-wider">
                  Amount
                </span>
                <div
                  className={cn(
                    "text-display font-display mt-1 tabular",
                    isIncome ? "text-secondary" : "text-on-surface",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(t.amount, t.currency)}
                </div>
              </div>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-label-caps uppercase",
                  isIncome
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-primary-container/10 text-primary",
                )}
              >
                {t.transaction_type}
              </span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
              <Field label="Merchant" value={t.merchant_name} />
              <Field label="Category" value={t.category} />
              <Field label="Item" value={t.item_name} />
              <Field label="Payment method" value={t.payment_method} />
              <Field label="Account" value={t.account_name} />
              <Field label="Currency" value={t.currency} />
              <Field label="Invoice #" value={t.invoice_number} />
              <Field label="Location" value={t.location} />
              <Field label="Source" value={t.source_channel} />
              <Field label="Parsed status" value={t.parsed_status} />
              <Field
                label="Confidence"
                value={t.confidence_score ? `${(t.confidence_score * 100).toFixed(0)}%` : null}
              />
              <Field
                label="Tags"
                value={t.tags && t.tags.length > 0 ? t.tags.join(", ") : null}
              />
            </dl>
            {t.notes ? (
              <div className="mt-6 pt-4 border-t border-outline-variant/50">
                <span className="text-label-caps text-outline uppercase tracking-wider">
                  Notes
                </span>
                <p className="text-body-md text-on-surface mt-2 whitespace-pre-wrap">
                  {t.notes}
                </p>
              </div>
            ) : null}
          </Card>

          {signedUrl ? (
            <Card>
              <CardHeader title="Receipt" />
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-primary font-semibold"
              >
                <Icon name="attachment" />
                Open attachment
              </a>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-outline uppercase tracking-wider text-label-caps">{label}</dt>
      <dd className="text-on-surface mt-1">{value || "-"}</dd>
    </div>
  );
}
