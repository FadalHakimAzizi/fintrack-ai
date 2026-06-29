"use client";

import { useState, useRef, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Select } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";

type MappableField =
  | "transaction_type"
  | "transaction_date"
  | "amount"
  | "merchant_name"
  | "item_name"
  | "category"
  | "payment_method"
  | "account_name"
  | "notes"
  | "currency"
  | "__skip";

const FIELD_LABELS: Record<string, string> = {
  transaction_type: "Tipe (pemasukan/pengeluaran)*",
  transaction_date: "Tanggal*",
  amount: "Jumlah*",
  merchant_name: "Merchant",
  item_name: "Nama item",
  category: "Kategori",
  payment_method: "Metode bayar",
  account_name: "Akun",
  notes: "Catatan",
  currency: "Mata uang",
  __skip: "— lewati —",
};

const STEPS_DEF = [
  { key: "upload", label: "Unggah", icon: "upload_file" },
  { key: "map", label: "Petakan", icon: "table_chart" },
  { key: "preview", label: "Pratinjau", icon: "preview" },
] as const;

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS_DEF.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-body-sm font-semibold transition-colors",
                  done
                    ? "bg-secondary text-on-secondary"
                    : active
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container text-on-surface-variant",
                )}
              >
                {done ? <Icon name="check" /> : i + 1}
              </div>
              <span
                className={cn(
                  "hidden text-body-sm font-medium sm:inline",
                  active ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS_DEF.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3",
                  i < current ? "bg-secondary" : "bg-surface-container-high",
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseLine);
  return { headers, rows };
}

function guessMapping(headers: string[]): Record<number, MappableField> {
  const map: Record<number, MappableField> = {};
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));

  const matchers: Array<[string[], MappableField]> = [
    [["type", "transaction_type", "tipe", "jenis"], "transaction_type"],
    [["date", "tanggal", "transaction_date", "tgl"], "transaction_date"],
    [["amount", "jumlah", "nominal", "nilai", "total", "debit", "credit"], "amount"],
    [["merchant", "merchant_name", "toko", "vendor", "payee"], "merchant_name"],
    [["item", "item_name", "description", "keterangan", "deskripsi"], "item_name"],
    [["category", "kategori", "cat"], "category"],
    [["payment", "payment_method", "metode", "cara_bayar"], "payment_method"],
    [["account", "account_name", "akun", "rekening"], "account_name"],
    [["notes", "note", "catatan", "memo", "remark"], "notes"],
    [["currency", "mata_uang"], "currency"],
  ];

  lower.forEach((h, i) => {
    for (const [patterns, field] of matchers) {
      if (patterns.some((p) => h.includes(p))) {
        if (!Object.values(map).includes(field)) {
          map[i] = field;
          break;
        }
      }
    }
    if (!(i in map)) map[i] = "__skip";
  });

  return map;
}

function applyMapping(
  headers: string[],
  rows: string[][],
  mapping: Record<number, MappableField>,
  defaultCurrency: string,
): Array<Record<string, string | number | null>> {
  return rows.map((row) => {
    const obj: Record<string, string | number | null> = { currency: defaultCurrency };
    headers.forEach((_, i) => {
      const field = mapping[i];
      if (!field || field === "__skip") return;
      let val: string | number | null = row[i]?.trim() || null;

      if (field === "amount" && val !== null) {
        const cleaned = String(val).replace(/[^0-9.,]/g, "").replace(",", ".");
        val = parseFloat(cleaned) || 0;
      }
      if (field === "transaction_type" && val !== null) {
        const lower = String(val).toLowerCase();
        if (["income", "pemasukan", "kredit", "credit", "in", "masuk"].some((k) => lower.includes(k))) {
          val = "income";
        } else {
          val = "expense";
        }
      }
      obj[field] = val;
    });
    return obj;
  });
}

export function CSVImporter({ defaultCurrency }: { defaultCurrency: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [previewRows, setPreviewRows] = useState<Array<Record<string, unknown>>>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { setError("Gagal membaca CSV. Periksa format file."); return; }
      if (r.length === 0) { setError("CSV tidak memiliki baris data."); return; }
      if (r.length > 1000) {
        setError(`File memiliki ${r.length} baris. Maksimal 1.000 baris per impor — silakan pecah filenya.`);
        return;
      }
      setHeaders(h);
      setRawRows(r);
      setMapping(guessMapping(h));
      setStep("map");
      setError(null);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv") || file?.type === "text/csv") handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onMapping(colIdx: number, field: MappableField) {
    setMapping((prev) => {
      const next = { ...prev };
      // clear previous binding of this field
      Object.keys(next).forEach((k) => {
        if (next[Number(k)] === field && Number(k) !== colIdx) next[Number(k)] = "__skip";
      });
      next[colIdx] = field;
      return next;
    });
  }

  function goPreview() {
    const hasDate = Object.values(mapping).includes("transaction_date");
    const hasAmount = Object.values(mapping).includes("amount");
    if (!hasDate || !hasAmount) {
      setError("Petakan minimal kolom Tanggal dan Jumlah.");
      return;
    }
    const mapped = applyMapping(headers, rawRows.slice(0, 200), mapping, defaultCurrency);
    // Sanity-check the mapped values so an alien dataset gets caught here (not
    // after a failed import): most rows must look like a real date + amount.
    const valid = mapped.filter((r) => {
      const d = String(r.transaction_date ?? "");
      const a = Number(r.amount);
      return /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(d) && Number.isFinite(a) && a > 0;
    }).length;
    if (mapped.length >= 4 && valid < mapped.length * 0.5) {
      setError(
        "Data tidak terlihat seperti transaksi. Pastikan kolom Tanggal & Jumlah dipetakan ke kolom yang benar.",
      );
      return;
    }
    setPreviewRows(mapped);
    setStep("preview");
    setError(null);
  }

  async function doImport() {
    setImporting(true);
    setError(null);
    try {
      const allMapped = applyMapping(headers, rawRows, mapping, defaultCurrency);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: allMapped }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Impor gagal"); setImporting(false); return; }
      setResult({ inserted: data.inserted, errors: data.errors || [] });
      setStep("done");
      router.refresh();
    } catch (e) {
      setError(String(e));
    }
    setImporting(false);
  }

  if (step === "done" && result) {
    return (
      <div className="animate-fade-up space-y-4 py-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary/15 text-secondary">
          <Icon name="check_circle" filled className="text-[32px]" />
        </div>
        <div>
          <h3 className="font-h2 text-h3 tracking-tight text-on-surface">Impor selesai!</h3>
          <p className="mt-1 text-body-md text-on-surface-variant">
            <span className="font-semibold text-on-surface tabular">{result.inserted}</span> transaksi diimpor.
          </p>
          {result.errors.length > 0 && (
            <p className="mt-1 text-body-sm text-error">
              {result.errors.length} baris error dan dilewati.
            </p>
          )}
        </div>
        <Button variant="primary" onClick={() => router.push("/transactions")}>
          <Icon name="receipt_long" />
          Lihat Transaksi
        </Button>
      </div>
    );
  }

  const currentStep = step === "upload" ? 0 : step === "map" ? 1 : 2;

  return (
    <div className="space-y-6">
      <Stepper current={currentStep} />

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">
          <Icon name="error" filled />
          {error}
        </div>
      )}

      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container-low",
          )}
        >
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/12 text-primary">
            <Icon name="upload_file" filled className="text-[32px]" />
          </div>
          <p className="text-body-lg font-medium text-on-surface">
            Tarik file CSV ke sini atau klik untuk unggah
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Mendukung ekspor BCA, Mandiri, GoPay, dan CSV apa pun dengan header
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-label-caps uppercase tracking-wider text-on-surface-variant">
            <Icon name="description" className="text-[14px]" />
            .CSV
          </span>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {step === "map" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-primary/[0.06] px-4 py-3 text-body-sm text-on-surface">
            <Icon name="table_chart" filled className="text-primary" />
            <span>
              <span className="font-semibold tabular">{rawRows.length}</span> baris terdeteksi. Cocokkan tiap kolom ke field yang tepat.
            </span>
          </div>

          <div className="space-y-2">
            {headers.map((header, i) => {
              const mapped = mapping[i] && mapping[i] !== "__skip";
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-3 transition-colors",
                    mapped
                      ? "border-outline-variant/40 bg-surface-container-lowest"
                      : "border-outline-variant/30 bg-surface-container-low/40",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name={mapped ? "check_circle" : "radio_button_unchecked"}
                        filled={mapped}
                        className={cn("text-[16px]", mapped ? "text-secondary" : "text-outline/50")}
                      />
                      <span className="truncate font-semibold text-on-surface">{header}</span>
                    </div>
                    <div className="mt-0.5 truncate pl-[22px] text-label-caps text-on-surface-variant">
                      contoh: {rawRows[0]?.[i] || "—"}
                    </div>
                  </div>
                  <div className="w-44 sm:w-52">
                    <Select
                      value={mapping[i] || "__skip"}
                      onChange={(e) => onMapping(i, e.target.value as MappableField)}
                    >
                      {Object.entries(FIELD_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={goPreview}>
              <Icon name="preview" />
              Pratinjau
            </Button>
            <Button variant="ghost" onClick={() => setStep("upload")}>
              <Icon name="arrow_back" />
              Kembali
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-primary/[0.06] px-4 py-3 text-body-sm text-on-surface">
            <Icon name="preview" filled className="text-primary" />
            <span>
              Menampilkan {Math.min(10, previewRows.length)} dari{" "}
              <span className="font-semibold tabular">{rawRows.length}</span> baris. Tinjau sebelum impor.
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                  <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">Tanggal</th>
                  <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">Tipe</th>
                  <th className="px-3 py-2 text-right font-semibold text-on-surface-variant">Jumlah</th>
                  <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">Merchant</th>
                  <th className="px-3 py-2 text-left font-semibold text-on-surface-variant">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low">
                    <td className="px-3 py-2 text-on-surface">{String(row.transaction_date || "—")}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-label-caps font-semibold",
                        row.transaction_type === "income"
                          ? "bg-secondary/15 text-secondary"
                          : "bg-tertiary/15 text-tertiary",
                      )}>
                        {row.transaction_type === "income" ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular text-on-surface">
                      {formatCurrency(Number(row.amount) || 0, String(row.currency || "IDR"))}
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">{String(row.merchant_name || "—")}</td>
                    <td className="px-3 py-2 text-on-surface-variant">{String(row.category || "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={doImport} disabled={importing}>
              <Icon name={importing ? "progress_activity" : "file_download"} className={importing ? "animate-spin" : ""} />
              {importing ? "Mengimpor…" : `Impor ${rawRows.length} transaksi`}
            </Button>
            <Button variant="ghost" onClick={() => setStep("map")}>
              <Icon name="arrow_back" />
              Kembali
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
