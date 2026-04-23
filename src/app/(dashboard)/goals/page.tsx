import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/topbar";
import { Icon } from "@/components/ui/icon";
import { GoalsList } from "@/components/goals/goals-list";
import type { SavingsGoal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: goalsData }, { data: profile }] = await Promise.all([
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("currency").eq("id", user!.id).single(),
  ]);

  const goals = (goalsData || []) as SavingsGoal[];
  const currency = profile?.currency || "IDR";

  return (
    <>
      <TopBar
        title="Savings Goals"
        subtitle="Track your financial milestones"
      />
      <div className="flex-1 p-8 overflow-y-auto max-w-container mx-auto w-full">
        <GoalsList goals={goals} currency={currency} />
      </div>
    </>
  );
}
