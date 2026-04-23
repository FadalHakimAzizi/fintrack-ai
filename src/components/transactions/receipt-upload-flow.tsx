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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-outline-variant hover:border-primary transition-colors rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer group"
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
        <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
          <Icon name="photo_camera" filled />
        </div>
        <p className="text-body-lg text-on-surface font-medium mb-1">
          Drop atau klik untuk pilih foto struk
        </p>
        <p className="text-body-sm text-outline mb-4">
          AI akan baca dan buat transaksi otomatis
        </p>
        <span className="text-label-caps text-outline uppercase tracking-wider">
          JPG · PNG · WEBP · PDF · max 8MB
        </span>
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
              Try again
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
                <span className="ml-auto text-label-caps text-outline uppercase">
                  Processing...
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {parsedPreview ? (
        <div className="mt-4 p-3 rounded-lg bg-surface-container-low text-body-sm text-on-surface">
          <span className="text-outline uppercase tracking-wider text-label-caps mr-2">
            Detected:
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
