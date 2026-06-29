"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";

interface Defaults {
  from?: string;
  to?: string;
  type?: string;
  category?: string;
}

const TRIGGER_CLS =
  "inline-flex items-center gap-1.5 rounded-lg border border-outline/30 bg-surface-container-low px-2.5 py-2 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface";

export function ExportDialog({
  categoryNames,
  defaults,
}: {
  categoryNames: string[];
  defaults?: Defaults;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(defaults?.from || "");
  const [to, setTo] = useState(defaults?.to || "");
  const [type, setType] = useState(defaults?.type || "all");
  const [category, setCategory] = useState(defaults?.category || "");

  function doExport() {
    const sp = new URLSearchParams();
    if (from) sp.set("from", from);
    if (to) sp.set("to", to);
    if (type && type !== "all") sp.set("type", type);
    if (category) sp.set("category", category);
    // Navigating to the CSV endpoint (Content-Disposition: attachment) triggers a
    // download without leaving the page.
    window.location.href = "/api/export?" + sp.toString();
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Ekspor CSV" className={TRIGGER_CLS}>
        <Icon name="download" />
        <span className="hidden lg:inline">Ekspor</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="animate-fade-up relative w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-elevated">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <Icon name="download" filled />
              </span>
              <div className="flex-1">
                <h3 className="font-h2 text-h3 tracking-tight text-on-surface">Ekspor CSV</h3>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  Pilih rentang dan filter untuk file yang diunduh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="exp-from">Dari tanggal</Label>
                  <Input id="exp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="exp-to">Sampai tanggal</Label>
                  <Input id="exp-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="exp-type">Tipe</Label>
                <Select id="exp-type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">Semua</option>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="exp-cat">Kategori</Label>
                <Select id="exp-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Semua kategori</option>
                  {categoryNames.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={doExport}>
                <Icon name="download" />
                Unduh CSV
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
