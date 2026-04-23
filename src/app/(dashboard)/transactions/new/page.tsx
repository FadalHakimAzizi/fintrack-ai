import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const supabase = createClient();

  const [{ data: categories }, { data: accounts }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name, kind").order("name"),
    supabase.from("accounts").select("id, name, kind").order("name"),
    supabase.from("profiles").select("currency").single(),
  ]);

  return (
    <>
      <TopBar title="New Transaction" subtitle="Record a new income or expense manually." />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <TransactionForm
          categories={categories || []}
          accounts={accounts || []}
          defaultCurrency={profile?.currency || "IDR"}
        />
      </div>
    </>
  );
}
