"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalsSummary } from "@/components/goals/goals-summary";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="space-y-6">
      {goals.length > 0 && !showForm ? <GoalsSummary goals={goals} currency={currency} /> : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-h2 tracking-tight text-on-surface">
          {showForm ? "Target tabungan baru" : "Target Anda"}
        </h2>
        {!showForm && goals.length > 0 && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Icon name="add" />
            Target Baru
          </Button>
        )}
      </div>

      {showForm && (
        <GoalForm defaultCurrency={currency} onCancel={() => setShowForm(false)} onDone={onFormDone} />
      )}

      {goals.length === 0 && !showForm ? (
        <EmptyState
          icon="savings"
          title="Belum ada target tabungan"
          description="Buat target untuk tetap termotivasi dan memantau progres Anda."
          action={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Icon name="add" />
              Buat target pertama
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="animate-fade-up">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-h3 font-h2 tracking-tight text-on-surface">Target Aktif</h3>
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-caps tabular text-on-surface-variant">
                  {active.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {active.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="animate-fade-up">
              <div className="mb-4 flex items-center gap-2">
                <Icon name="check_circle" filled className="text-secondary" />
                <h3 className="text-h3 font-h2 tracking-tight text-on-surface">Selesai</h3>
                <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-label-caps tabular text-secondary">
                  {completed.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 opacity-90 md:grid-cols-2 xl:grid-cols-3">
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
