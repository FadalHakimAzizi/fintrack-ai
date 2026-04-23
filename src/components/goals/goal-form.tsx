"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { createGoal } from "@/app/(dashboard)/goals/actions";

const GOAL_COLORS = [
  "#00288e", "#006c49", "#611e00", "#7c3aed", "#b45309",
  "#0e7490", "#be123c", "#1d4ed8",
];

const GOAL_ICONS = [
  "savings", "home", "directions_car", "flight", "school",
  "devices", "favorite", "celebration", "beach_access", "shopping_bag",
];

export function GoalForm({
  defaultCurrency,
  onCancel,
  onDone,
}: {
  defaultCurrency: string;
  onCancel: () => void;
  onDone?: () => void;
}) {
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    fd.set("icon", icon);
    const result = await createGoal(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Failed to create goal");
    } else {
      onDone ? onDone() : onCancel();
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-6 border border-outline-variant/40 rounded-xl bg-surface-container-low">
      <h3 className="text-h3 font-h3 text-on-surface">New Savings Goal</h3>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goal-name">Goal name</Label>
          <Input id="goal-name" name="name" required placeholder="e.g. Emergency Fund, New Laptop" />
        </div>
        <div>
          <Label htmlFor="goal-target">Target amount</Label>
          <Input id="goal-target" name="target_amount" type="number" min="1" step="1000" required placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goal-current">Starting amount</Label>
          <Input id="goal-current" name="current_amount" type="number" min="0" step="1000" defaultValue="0" />
        </div>
        <div>
          <Label htmlFor="goal-date">Target date (optional)</Label>
          <Input id="goal-date" name="target_date" type="date" min={today} />
        </div>
      </div>

      <input type="hidden" name="currency" value={defaultCurrency} />

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? "var(--on-surface)" : "transparent" }}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {GOAL_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={cn(
                "w-9 h-9 rounded-lg grid place-items-center transition-colors",
                icon === ic
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
            >
              <Icon name={ic} filled={icon === ic} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="goal-notes">Notes (optional)</Label>
        <Textarea id="goal-notes" name="notes" rows={2} placeholder="What's this goal for?" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving..." : "Create Goal"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
