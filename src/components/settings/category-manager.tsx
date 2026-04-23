"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createCategory, deleteCategory } from "@/app/(dashboard)/settings/categories/actions";
import type { Category } from "@/lib/types";

const PRESET_COLORS = [
  "#1e40af", "#006c49", "#611e00", "#7c3aed", "#b45309",
  "#0e7490", "#be123c", "#166534", "#1d4ed8", "#9d174d",
];

const PRESET_ICONS = [
  "shopping_bag", "restaurant", "directions_car", "home", "sports_esports",
  "local_hospital", "school", "flight", "fitness_center", "attach_money",
  "savings", "work", "phone_android", "electrical_services", "pets",
];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);

  const filtered = categories.filter((c) => c.kind === activeTab);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("color", selectedColor);
    fd.set("icon", selectedIcon);
    const result = await createCategory(fd);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || "Failed to create");
    } else {
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This won't delete existing transactions.`)) return;
    const result = await deleteCategory(id);
    if (!result.ok) alert(result.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-surface-container rounded-lg w-full max-w-xs">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-center text-body-md font-medium rounded-md capitalize transition-colors",
              activeTab === tab
                ? "bg-surface-container-lowest shadow-sm text-on-surface"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <div
              className="w-9 h-9 rounded-full grid place-items-center shrink-0"
              style={{ backgroundColor: cat.color || "#e5eeff", color: cat.color ? "#fff" : "var(--primary)" }}
            >
              <Icon name={cat.icon || "label"} filled />
            </div>
            <span className="text-body-md text-on-surface flex-1">{cat.name}</span>
            <button
              onClick={() => onDelete(cat.id, cat.name)}
              className="w-8 h-8 rounded-full grid place-items-center text-outline hover:text-error hover:bg-error-container transition-colors"
              title="Delete category"
            >
              <Icon name="delete" />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-body-sm text-outline py-4 text-center">
            No {activeTab} categories yet.
          </p>
        )}
      </div>

      {!showForm ? (
        <Button variant="ghost" onClick={() => setShowForm(true)}>
          <Icon name="add" />
          Add {activeTab} category
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 p-4 border border-outline-variant/40 rounded-xl bg-surface-container-low">
          <h4 className="text-body-md font-semibold text-on-surface">New {activeTab} category</h4>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
              {error}
            </div>
          )}

          <input type="hidden" name="kind" value={activeTab} />

          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" required placeholder="e.g. Travel, Rent..." />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? "var(--on-surface)" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSelectedIcon(ic)}
                  className={cn(
                    "w-9 h-9 rounded-lg grid place-items-center transition-colors",
                    selectedIcon === ic
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                  )}
                >
                  <Icon name={ic} filled={selectedIcon === ic} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
