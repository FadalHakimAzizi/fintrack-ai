"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createCategory, deleteCategory } from "@/app/(dashboard)/settings/categories/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
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
  const confirm = useConfirm();
  const toast = useToast();
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

  async function restore(cat: Category) {
    const fd = new FormData();
    fd.set("name", cat.name);
    fd.set("kind", cat.kind);
    if (cat.color) fd.set("color", cat.color);
    if (cat.icon) fd.set("icon", cat.icon);
    await createCategory(fd);
  }

  async function onDelete(cat: Category) {
    const ok = await confirm({
      title: `Hapus kategori "${cat.name}"?`,
      description: "Transaksi yang sudah ada tidak akan ikut terhapus.",
      confirmLabel: "Hapus",
      tone: "danger",
    });
    if (!ok) return;
    const result = await deleteCategory(cat.id);
    if (!result.ok) {
      toast({ message: result.error || "Gagal menghapus kategori", tone: "error" });
      return;
    }
    toast({
      message: `Kategori "${cat.name}" dihapus`,
      tone: "success",
      action: { label: "Urungkan", onClick: () => restore(cat) },
    });
  }

  const expenseCount = categories.filter((c) => c.kind === "expense").length;
  const incomeCount = categories.filter((c) => c.kind === "income").length;
  const tabLabel = activeTab === "expense" ? "pengeluaran" : "pemasukan";

  return (
    <div className="space-y-6">
      <div className="flex w-full max-w-sm rounded-xl bg-surface-container p-1">
        {(["expense", "income"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-body-md font-medium transition-colors",
              activeTab === tab
                ? "bg-surface-container-lowest text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Icon name={tab === "expense" ? "trending_down" : "trending_up"} className="text-[18px]" />
            {tab === "expense" ? "Pengeluaran" : "Pemasukan"}
            <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-label-caps tabular text-on-surface-variant">
              {tab === "expense" ? expenseCount : incomeCount}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((cat) => {
          const color = cat.color || "#3755c3";
          return (
            <div
              key={cat.id}
              className="group flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 transition-colors hover:bg-surface-container-low"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-black/[0.04]"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                <Icon name={cat.icon || "label"} filled />
              </span>
              <span className="flex-1 truncate font-medium text-on-surface">{cat.name}</span>
              <button
                onClick={() => onDelete(cat)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-on-surface-variant/50 transition-colors hover:bg-error-container hover:text-error"
                title="Hapus kategori"
                aria-label={`Hapus kategori ${cat.name}`}
              >
                <Icon name="delete" className="text-[20px]" />
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-outline-variant/70 py-8 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Belum ada kategori {tabLabel}.
            </p>
          </div>
        )}
      </div>

      {!showForm ? (
        <Button variant="ghost" onClick={() => setShowForm(true)}>
          <Icon name="add" />
          Tambah kategori {tabLabel}
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
          <h4 className="font-semibold text-on-surface">Kategori {tabLabel} baru</h4>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">
              <Icon name="error" filled />
              {error}
            </div>
          )}

          <input type="hidden" name="kind" value={activeTab} />

          <div>
            <Label htmlFor="cat-name">Nama</Label>
            <Input id="cat-name" name="name" required placeholder="mis. Liburan, Sewa…" />
          </div>

          <div>
            <Label>Warna</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Warna ${c}`}
                  className="h-8 w-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? "rgb(var(--on-surface))" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Ikon</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setSelectedIcon(ic)}
                  aria-label={`Ikon ${ic}`}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition-colors",
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

          {/* Live preview */}
          <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2">
            <span className="text-label-caps uppercase tracking-wider text-on-surface-variant">Pratinjau</span>
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ backgroundColor: `${selectedColor}1f`, color: selectedColor }}
            >
              <Icon name={selectedIcon} filled className="text-[18px]" />
            </span>
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={submitting}>
              <Icon name={submitting ? "progress_activity" : "save"} className={submitting ? "animate-spin" : ""} />
              {submitting ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>
              Batal
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
