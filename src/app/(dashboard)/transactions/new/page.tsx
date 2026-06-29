import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name, kind").order("name"),
    supabase.from("profiles").select("currency").single(),
  ]);

  return (
    <>
      <TopBar back="/transactions" title="Transaksi Baru" subtitle="Catat pemasukan atau pengeluaran baru secara manual." />
      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <TransactionForm
          categories={categories || []}
          defaultCurrency={profile?.currency || "IDR"}
        />
      </div>
    </>
  );
}
