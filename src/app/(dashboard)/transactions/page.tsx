import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { TxRow } from "@/components/transactions/tx-row";
import { SemanticSearch } from "@/components/transactions/semantic-search";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  type?: "income" | "expense" | "all";
  source?: string;
  category?: string;
  from?: string;
  to?: string;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

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

  const { data: rows } = await query;

  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .order("name");
  const categoryNames = Array.from(
    new Set((categories || []).map((c) => c.name)),
  );

  const exportUrl =
    "/api/export?" +
    new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][],
    ).toString();

  return (
    <>
      <TopBar
        title="Transactions"
        subtitle="All income and expense records"
        action={
          <div className="flex items-center gap-2">
            <a href={exportUrl}>
              <Button size="sm" variant="ghost">
                <Icon name="download" />
                Export CSV
              </Button>
            </a>
            <Link href="/transactions/import">
              <Button size="sm" variant="ghost">
                <Icon name="upload_file" />
                Import CSV
              </Button>
            </Link>
            <Link href="/transactions/upload">
              <Button size="sm" variant="ghost">
                <Icon name="photo_camera" />
                Upload Receipt
              </Button>
            </Link>
            <Link href="/transactions/new">
              <Button size="sm" variant="primary">
                <Icon name="add" />
                New
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full space-y-6">
        <Card>
          <CardHeader title="AI Search" subtitle="Search by natural language — try Indonesian too" />
          <SemanticSearch />
        </Card>

        <Card>
          <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              name="q"
              defaultValue={searchParams.q || ""}
              placeholder="Search merchant, item, notes..."
              className="md:col-span-2 px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            />
            <select
              name="type"
              defaultValue={searchParams.type || "all"}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              name="source"
              defaultValue={searchParams.source || ""}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            >
              <option value="">All sources</option>
              <option value="website">Website</option>
              <option value="telegram">Telegram</option>
              <option value="gmail">Gmail</option>
              <option value="ocr">OCR</option>
              <option value="api">API</option>
            </select>
            <select
              name="category"
              defaultValue={searchParams.category || ""}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            >
              <option value="">All categories</option>
              {categoryNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="from"
              defaultValue={searchParams.from || ""}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            />
            <input
              type="date"
              name="to"
              defaultValue={searchParams.to || ""}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm focus-ring"
            />
            <Button type="submit" size="sm" className="md:col-span-2">
              <Icon name="filter_alt" />
              Apply filters
            </Button>
            <Link
              href="/transactions"
              className="md:col-span-1 px-4 py-2 border border-outline-variant rounded-lg text-body-sm text-center text-on-surface-variant hover:bg-surface-container"
            >
              Reset
            </Link>
          </form>
        </Card>

        <Card>
          {rows && rows.length > 0 ? (
            <div className="space-y-1">
              {(rows as Transaction[]).map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Icon name="search_off" className="text-outline" />
              <p className="text-body-md text-on-surface mt-2">No matching transactions</p>
              <p className="text-body-sm text-outline">
                Try adjusting your filters or add a new transaction.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
