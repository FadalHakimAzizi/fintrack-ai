import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { EditTransactionForm } from "@/components/transactions/edit-transaction-form";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: tx }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from("transactions").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("categories").select("id, name, kind").order("name"),
    supabase.from("profiles").select("currency").single(),
  ]);

  if (!tx) notFound();

  return (
    <>
      <TopBar
        title="Edit Transaksi"
        subtitle={tx.merchant_name || tx.item_name || "Transaksi"}
      />
      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <EditTransactionForm
          tx={tx as Transaction}
          categories={categories || []}
          defaultCurrency={profile?.currency || "IDR"}
        />
      </div>
    </>
  );
}
