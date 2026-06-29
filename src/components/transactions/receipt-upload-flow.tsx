"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "ocr" | "done" | "error";

const STEPS: { phase: Phase; label: string; icon: string }[] = [
  { phase: "uploading", label: "Mengupload file ke storage", icon: "cloud_upload" },
  { phase: "ocr", label: "Membaca struk dengan AI...", icon: "auto_awesome" },
  { phase: "done", label: "Transaksi tersimpan", icon: "check_circle" },
];

export function ReceiptUploadFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setPhase("error");
      setError("File terlalu besar (maks 8MB).");
      return;
    }
    setFileName(file.name);
    setError(null);
    setParsedPreview(null);

    setPhase("uploading");
    const fd = new FormData();
    fd.append("file", file);

    try {
      setPhase("ocr");
      const res = await fetch("/api/upload-receipt", { method: "POST", body: fd });
      const text = await res.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }

      if (!res.ok) {
        setPhase("error");
        setError(body?.error || `Upload gagal (${res.status})`);
        return;
      }

      if (body?.parsed) {
        const p = body.parsed;
        const amt = typeof p.amount === "number"
          ? p.amount.toLocaleString("id-ID")
          : "?";
        setParsedPreview(
          `${p.merchant_name || p.item_name || "transaksi"} · ${p.category || "—"} · ${p.currency || "IDR"} ${amt}`,
        );
      }

      setPhase("done");

      if (body.transaction_id) {
        setTimeout(() => router.push(`/transactions/${body.transaction_id}`), 1200);
      } else {
        setTimeout(() => router.push("/transactions"), 1200);
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function reset() {
    setPhase("idle");
    setFileName(null);
    setError(null);
    setParsedPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (phase === "idle") {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container-low",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary shadow-sm ring-1 ring-inset ring-white/15 transition-transform group-hover:scale-105">
          <Icon name="photo_camera" filled className="text-[32px]" />
        </div>
        <p className="text-body-lg font-medium text-on-surface">
          Tarik atau klik untuk pilih foto struk
        </p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          AI akan membaca dan membuat transaksi otomatis
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {["JPG", "PNG", "WEBP", "PDF"].map((ext) => (
            <span
              key={ext}
              className="rounded-full bg-surface-container px-2.5 py-0.5 text-label-caps uppercase tracking-wider text-on-surface-variant"
            >
              {ext}
            </span>
          ))}
          <span className="text-label-caps uppercase tracking-wider text-outline">maks 8MB</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-outline-variant/50 rounded-xl p-8 bg-surface-container-lowest">
      {fileName ? (
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-outline-variant/50">
          <div className="w-10 h-10 rounded-full bg-surface-container grid place-items-center">
            <Icon name="description" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body-md text-on-surface font-medium truncate">
              {fileName}
            </div>
            <div className="text-body-sm text-outline">
              {phase === "error" ? "Gagal" : phase === "done" ? "Selesai" : "Memproses..."}
            </div>
          </div>
          {phase === "error" ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              <Icon name="refresh" />
              Coba lagi
            </Button>
          ) : null}
        </div>
      ) : null}

      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const reached =
            (step.phase === "uploading") ||
            (step.phase === "ocr" && (phase === "ocr" || phase === "done")) ||
            (step.phase === "done" && phase === "done");
          const current =
            (step.phase === "uploading" && phase === "uploading") ||
            (step.phase === "ocr" && phase === "ocr");
          const done = reached && !current;
          return (
            <li
              key={step.phase}
              className={cn(
                "flex items-center gap-3 text-body-md",
                done
                  ? "text-secondary"
                  : current
                    ? "text-on-surface"
                    : "text-outline",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full grid place-items-center shrink-0",
                  done
                    ? "bg-secondary-container text-on-secondary-container"
                    : current
                      ? "bg-primary-container/10 text-primary animate-pulse"
                      : "bg-surface-container text-outline",
                )}
              >
                <Icon name={done ? "check" : step.icon} filled={current || done} />
              </div>
              <span>{step.label}</span>
              {current ? (
                <span className="ml-auto text-label-caps uppercase tracking-wider text-outline">
                  Memproses…
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {parsedPreview ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/10 p-3 text-body-sm text-on-surface">
          <Icon name="auto_awesome" filled className="text-secondary" />
          <span className="text-label-caps uppercase tracking-wider text-on-surface-variant">
            Terdeteksi:
          </span>
          {parsedPreview}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
          {error}
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="mt-4 text-body-sm text-outline text-center">
          Membawa Anda ke halaman review...
        </div>
      ) : null}
    </div>
  );
}
