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
        title="Categories"
        subtitle="Manage your income and expense categories"
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader
              title="Categories"
              subtitle="Add, customize, or remove transaction categories"
            />
            <CategoryManager categories={(categories || []) as Category[]} />
          </Card>
        </div>
      </div>
    </>
  );
}
