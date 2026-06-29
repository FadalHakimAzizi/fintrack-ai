import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TxRow } from "@/components/transactions/tx-row";
import { SemanticSearch } from "@/components/transactions/semantic-search";
import { ExportDialog } from "@/components/transactions/export-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Pagination } from "@/components/transactions/pagination";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  telegram: "Telegram",
  gmail: "Gmail",
  ocr: "OCR",
  api: "API",
};

interface SearchParams {
  q?: string;
  type?: "income" | "expense" | "all";
  source?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (searchParams.type && searchParams.type !== "all") {
    query = query.eq("transaction_type", searchParams.type);
  }
  if (searchParams.source) {
    query = query.eq("source_channel", searchParams.source);
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }
  if (searchParams.from) {
    query = query.gte("transaction_date", searchParams.from);
  }
  if (searchParams.to) {
    query = query.lte("transaction_date", searchParams.to);
  }
  if (searchParams.q) {
    const escaped = searchParams.q.replace(/[%,]/g, "");
    query = query.or(
      `merchant_name.ilike.%${escaped}%,item_name.ilike.%${escaped}%,notes.ilike.%${escaped}%`,
    );
  }

  const { data: rows, count } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categoryNames = Array.from(
    new Set((categories || []).map((c) => c.name)),
  );

  // Filters carried through export + pagination (everything except `page`).
  const filterEntries = Object.entries(searchParams).filter(
    ([k, v]) => v && k !== "page",
  ) as [string, string][];
  const paramsRecord = Object.fromEntries(filterEntries);

  const removeHref = (key: string) => {
    const sp = new URLSearchParams(paramsRecord);
    sp.delete(key);
    const qs = sp.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };

  const active: { key: string; icon: string; label: string }[] = [];
  if (searchParams.q) active.push({ key: "q", icon: "search", label: `"${searchParams.q}"` });
  if (searchParams.type && searchParams.type !== "all")
    active.push({
      key: "type",
      icon: searchParams.type === "income" ? "trending_up" : "trending_down",
      label: searchParams.type === "income" ? "Pemasukan" : "Pengeluaran",
    });
  if (searchParams.source)
    active.push({ key: "source", icon: "podcasts", label: SOURCE_LABELS[searchParams.source] || searchParams.source });
  if (searchParams.category) active.push({ key: "category", icon: "category", label: searchParams.category });
  if (searchParams.from) active.push({ key: "from", icon: "event", label: `Dari ${searchParams.from}` });
  if (searchParams.to) active.push({ key: "to", icon: "event", label: `Sampai ${searchParams.to}` });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listed = rows?.length ?? 0;
  const start = total === 0 ? 0 : rangeFrom + 1;
  const end = rangeFrom + listed;

  return (
    <>
      <TopBar
        title="Transaksi"
        subtitle="Semua catatan pemasukan dan pengeluaran"
        action={
          <div className="flex items-center gap-1.5">
            <ExportDialog
              categoryNames={categoryNames}
              defaults={{
                from: searchParams.from,
                to: searchParams.to,
                type: searchParams.type,
                category: searchParams.category,
              }}
            />
            <NavAction href="/transactions/import" icon="upload_file" label="Impor" />
            <NavAction href="/transactions/upload" icon="photo_camera" label="Struk" />
            <Link href="/transactions/new">
              <Button size="sm" variant="primary">
                <Icon name="add" />
                <span className="hidden sm:inline">Transaksi Baru</span>
                <span className="sm:hidden">Baru</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full space-y-6 p-6 md:p-8">
        {/* AI search — distinct gradient panel */}
        <section className="animate-fade-up surface-sheen relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-surface-container-lowest to-secondary/[0.05] p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary shadow-sm ring-1 ring-inset ring-white/15">
              <Icon name="auto_awesome" filled />
            </span>
            <div>
              <h3 className="font-h2 text-h3 tracking-tight text-on-surface">Pencarian AI</h3>
              <p className="text-body-sm text-on-surface-variant">
                Cari dengan bahasa natural — coba pakai Bahasa Indonesia
              </p>
            </div>
          </div>
          <SemanticSearch />
        </section>

        {/* Filters */}
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <TransactionFilters
            searchParams={searchParams}
            categoryNames={categoryNames}
            activeCount={active.length}
          />
        </div>

        {/* Results */}
        <Card className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* Keterangan: count + active filter chips */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-4">
            <p className="text-body-sm text-on-surface-variant">
              {total > 0 ? (
                <>
                  Menampilkan <span className="font-semibold text-on-surface tabular">{start}–{end}</span>{" "}
                  dari <span className="font-semibold text-on-surface tabular">{total}</span> transaksi
                </>
              ) : (
                "Tidak ada transaksi yang cocok"
              )}
            </p>
            {active.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {active.map((f) => (
                  <Link
                    key={f.key}
                    href={removeHref(f.key)}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-2.5 pr-1.5 text-body-sm font-medium text-primary transition-colors hover:bg-primary/15"
                  >
                    <Icon name={f.icon} className="text-[16px]" />
                    <span className="max-w-[14rem] truncate">{f.label}</span>
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-primary/20 group-hover:bg-primary/30">
                      <Icon name="close" className="text-[14px]" />
                    </span>
                  </Link>
                ))}
                <Link href="/transactions" className="ml-1 text-body-sm font-medium text-on-surface-variant hover:text-primary">
                  Hapus semua
                </Link>
              </div>
            ) : null}
          </div>

          {rows && rows.length > 0 ? (
            <div className="space-y-1">
              {(rows as Transaction[]).map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-container">
                <Icon name="search_off" className="text-outline" />
              </div>
              <p className="text-body-md font-medium text-on-surface">Tidak ada transaksi cocok</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Coba sesuaikan filter, atau tambahkan transaksi baru.
              </p>
              <Link href="/transactions/new" className="mt-4 inline-block">
                <Button size="sm">
                  <Icon name="add" />
                  Transaksi Baru
                </Button>
              </Link>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} params={paramsRecord} />
        </Card>
      </div>
    </>
  );
}

function NavAction({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: string;
  label: string;
  external?: boolean;
}) {
  const cls =
    "inline-flex items-center gap-1.5 rounded-lg border border-outline/30 bg-surface-container-low px-2.5 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface";
  const inner = (
    <>
      <Icon name={icon} />
      <span className="hidden lg:inline">{label}</span>
    </>
  );
  return external ? (
    <a href={href} title={label} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} title={label} className={cls}>
      {inner}
    </Link>
  );
}
