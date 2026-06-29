import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { CategoryManager } from "@/components/settings/category-manager";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <>
      <TopBar
        back="/settings"
        title="Kategori"
        subtitle="Kelola kategori pemasukan dan pengeluaran Anda"
      />
      <div className="flex-1 overflow-y-auto max-w-container mx-auto w-full p-6 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card className="animate-fade-up">
            <CardHeader
              icon="category"
              title="Kategori"
              subtitle="Tambah, sesuaikan, atau hapus kategori transaksi"
            />
            <CategoryManager categories={(categories || []) as Category[]} />
          </Card>
        </div>
      </div>
    </>
  );
}
