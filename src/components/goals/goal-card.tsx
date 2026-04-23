"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { updateGoalAmount, deleteGoal } from "@/app/(dashboard)/goals/actions";
import type { SavingsGoal } from "@/lib/types";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function GoalCard({ goal }: { goal: SavingsGoal }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newAmount, setNewAmount] = useState(String(goal.current_amount));
  const [saving, setSaving] = useState(false);

  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const remaining = goal.target_amount - goal.current_amount;
  const days = daysUntil(goal.target_date);
  const completed = goal.status === "completed";
  const color = goal.color || "var(--primary)";

  async function handleSave() {
    setSaving(true);
    const result = await updateGoalAmount(goal.id, Number(newAmount));
    setSaving(false);
    if (result.ok) { setEditing(false); router.refresh(); }
    else alert(result.error);
  }

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    const result = await deleteGoal(goal.id);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <div className={cn(
      "bg-surface-container-lowest rounded-xl p-6 shadow-card border transition-all",
      completed ? "border-secondary/40" : "border-outline-variant/30",
    )}>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full grid place-items-center shrink-0 text-white"
          style={{ backgroundColor: color }}
        >
          <Icon name={goal.icon || "savings"} filled />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-body-md font-semibold text-on-surface truncate">{goal.name}</h3>
            {completed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-label-caps">
                <Icon name="check_circle" filled />
                Done!
              </span>
            )}
          </div>
          {goal.target_date && (
            <div className={cn(
              "text-body-sm flex items-center gap-1 mt-0.5",
              days !== null && days < 0 ? "text-error" : "text-outline",
            )}>
              <Icon name="calendar_today" />
              {days !== null && days < 0
                ? `Overdue by ${Math.abs(days)} days`
                : days !== null && days === 0
                ? "Due today!"
                : `${days} days left · ${formatDate(goal.target_date)}`}
            </div>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="w-8 h-8 rounded-full grid place-items-center text-outline hover:text-error hover:bg-error-container transition-colors shrink-0"
        >
          <Icon name="delete" />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-body-sm text-outline mb-1.5">
          <span>{formatCurrency(goal.current_amount, goal.currency)}</span>
          <span>{pct}% of {formatCurrency(goal.target_amount, goal.currency)}</span>
        </div>
        <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        {!completed && (
          <p className="text-body-sm text-outline mt-1.5">
            {formatCurrency(remaining, goal.currency)} remaining
          </p>
        )}
      </div>

      {!editing ? (
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Icon name="edit" />
          Update amount
        </Button>
      ) : (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor={`amount-${goal.id}`} className="text-label-caps">Current amount</Label>
            <Input
              id={`amount-${goal.id}`}
              type="number"
              min="0"
              step="1000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "..." : "Save"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      )}

      {goal.notes && (
        <p className="text-body-sm text-outline mt-3 border-t border-outline-variant/30 pt-3">
          {goal.notes}
        </p>
      )}
    </div>
  );
}
