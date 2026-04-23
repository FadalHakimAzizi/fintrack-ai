"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import type { SavingsGoal } from "@/lib/types";

export function GoalsList({ goals, currency }: { goals: SavingsGoal[]; currency: string }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  function onFormDone() {
    setShowForm(false);
    router.refresh();
  }

  const active = goals.filter((g) => g.status !== "completed");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        {!showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Icon name="add" />
            New Goal
          </Button>
        )}
      </div>

      {showForm && (
        <GoalForm defaultCurrency={currency} onCancel={() => setShowForm(false)} onDone={onFormDone} />
      )}

      {goals.length === 0 && !showForm ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-container grid place-items-center">
            <Icon name="savings" />
          </div>
          <p className="text-body-md text-on-surface mb-2">No savings goals yet</p>
          <p className="text-body-sm text-outline mb-6">Set a goal to stay motivated and track your progress.</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Icon name="add" />
            Create first goal
          </Button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-h2 font-h2 text-on-surface mb-4">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {active.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-h2 font-h2 text-on-surface mb-4 flex items-center gap-2">
                <Icon name="check_circle" filled />
                Completed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-75">
                {completed.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
