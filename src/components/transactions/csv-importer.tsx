"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Label, Select } from "@/components/ui/input";
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
  transaction_type: "Type (income/expense)*",
  transaction_date: "Date*",
  amount: "Amount*",
  merchant_name: "Merchant",
  item_name: "Item name",
  category: "Category",
  payment_method: "Payment method",
  account_name: "Account",
  notes: "Notes",
  currency: "Currency",
  __skip: "— skip —",
};

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
      if (h.length === 0) { setError("Could not parse CSV. Check the file format."); return; }
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
      setError("Please map at least Date and Amount columns.");
      return;
    }
    const mapped = applyMapping(headers, rawRows.slice(0, 200), mapping, defaultCurrency);
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
      if (!res.ok) { setError(data.error || "Import failed"); setImporting(false); return; }
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
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 text-secondary grid place-items-center">
          <Icon name="check_circle" filled />
        </div>
        <h3 className="text-h3 font-h3 text-on-surface">Import complete!</h3>
        <p className="text-body-md text-outline">{result.inserted} transactions imported.</p>
        {result.errors.length > 0 && (
          <p className="text-body-sm text-error">{result.errors.length} rows had errors and were skipped.</p>
        )}
        <Button variant="primary" onClick={() => router.push("/transactions")}>
          View Transactions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">{error}</div>
      )}

      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-outline-variant hover:border-primary hover:bg-surface-container-low",
          )}
        >
          <Icon name="upload_file" />
          <p className="text-body-md text-on-surface mt-3 font-medium">
            Drop a CSV file here or click to upload
          </p>
          <p className="text-body-sm text-outline mt-1">
            Supports BCA, Mandiri, GoPay exports and any CSV with headers
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {step === "map" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-h3 font-h3 text-on-surface mb-1">Map CSV Columns</h3>
            <p className="text-body-sm text-outline">
              {rawRows.length} rows detected. Match each column to the correct field.
            </p>
          </div>

          <div className="space-y-3">
            {headers.map((header, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-outline-variant/40 bg-surface-container-low">
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-semibold text-on-surface truncate">{header}</div>
                  <div className="text-label-caps text-outline truncate">
                    e.g. {rawRows[0]?.[i] || "—"}
                  </div>
                </div>
                <div className="w-52">
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
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={goPreview}>
              Preview Import
            </Button>
            <Button variant="ghost" onClick={() => setStep("upload")}>Back</Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-h3 font-h3 text-on-surface mb-1">Preview</h3>
            <p className="text-body-sm text-outline">
              Showing first {Math.min(10, previewRows.length)} of {rawRows.length} rows. Review before importing.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40">
                  <th className="text-left px-3 py-2 text-outline font-semibold">Date</th>
                  <th className="text-left px-3 py-2 text-outline font-semibold">Type</th>
                  <th className="text-right px-3 py-2 text-outline font-semibold">Amount</th>
                  <th className="text-left px-3 py-2 text-outline font-semibold">Merchant</th>
                  <th className="text-left px-3 py-2 text-outline font-semibold">Category</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low">
                    <td className="px-3 py-2 text-on-surface">{String(row.transaction_date || "—")}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-label-caps",
                        row.transaction_type === "income"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-primary/10 text-primary",
                      )}>
                        {String(row.transaction_type || "expense")}
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
              {importing ? "Importing..." : `Import ${rawRows.length} transactions`}
            </Button>
            <Button variant="ghost" onClick={() => setStep("map")}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
}
