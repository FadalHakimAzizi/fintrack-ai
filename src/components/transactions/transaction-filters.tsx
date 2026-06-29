import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface SearchParams {
  q?: string;
  type?: string;
  source?: string;
  category?: string;
  from?: string;
  to?: string;
}

const ctrl =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-body-sm text-on-surface placeholder:text-outline/60 focus-ring transition-colors";

const SOURCES = [
  ["website", "Website"],
  ["telegram", "Telegram"],
  ["gmail", "Gmail"],
  ["ocr", "OCR"],
  ["api", "API"],
] as const;

export function TransactionFilters({
  searchParams,
  categoryNames,
  activeCount,
}: {
  searchParams: SearchParams;
  categoryNames: string[];
  activeCount: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon name="tune" filled />
          </span>
          <div>
            <h3 className="font-h2 text-h3 tracking-tight text-on-surface">Filter</h3>
            <p className="text-body-sm text-on-surface-variant">Persempit daftar transaksi</p>
          </div>
        </div>
        {activeCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-body-sm font-semibold text-primary">
            {activeCount} filter aktif
          </span>
        ) : null}
      </div>

      <form method="GET" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Kata kunci" className="sm:col-span-2">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Merchant, item, catatan…"
                className={cn(ctrl, "pl-10")}
              />
            </div>
          </Field>

          <Field label="Tipe">
            <SelectWrap>
              <select name="type" defaultValue={searchParams.type || "all"} className={cn(ctrl, "appearance-none pr-9")}>
                <option value="all">Semua tipe</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </SelectWrap>
          </Field>

          <Field label="Sumber">
            <SelectWrap>
              <select name="source" defaultValue={searchParams.source || ""} className={cn(ctrl, "appearance-none pr-9")}>
                <option value="">Semua sumber</option>
                {SOURCES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </Field>

          <Field label="Kategori">
            <SelectWrap>
              <select name="category" defaultValue={searchParams.category || ""} className={cn(ctrl, "appearance-none pr-9")}>
                <option value="">Semua kategori</option>
                {categoryNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </Field>

          <Field label="Dari tanggal">
            <input type="date" name="from" defaultValue={searchParams.from || ""} className={ctrl} />
          </Field>

          <Field label="Sampai tanggal">
            <input type="date" name="to" defaultValue={searchParams.to || ""} className={ctrl} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/30 pt-4">
          <Button type="submit" size="sm">
            <Icon name="filter_alt" />
            Terapkan filter
          </Button>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-outline/30 bg-surface-container-low px-4 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            <Icon name="restart_alt" />
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-label-caps uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
    </div>
  );
}
