"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Uploaded {
  path: string;
  url: string;
}

export function ReceiptUploader({
  onUploaded,
}: {
  onUploaded: (u: Uploaded | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setStatus("error");
      setErrorMsg("File too large (max 5MB).");
      return;
    }
    setStatus("uploading");
    setFileName(file.name);
    setErrorMsg(null);

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const msg = await res.text();
      setStatus("error");
      setErrorMsg(msg || "Upload failed");
      onUploaded(null);
      return;
    }
    const json = (await res.json()) as Uploaded;
    setStatus("done");
    onUploaded(json);
  }

  function reset() {
    setStatus("idle");
    setFileName(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
    onUploaded(null);
  }

  return (
    <div
      onClick={() => status === "idle" && inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group",
        status === "error"
          ? "border-error bg-error-container/30"
          : status === "done"
            ? "border-secondary bg-secondary-container/30"
            : "border-outline-variant hover:border-primary",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
        <Icon
          name={
            status === "done"
              ? "check_circle"
              : status === "error"
                ? "error"
                : "cloud_upload"
          }
          filled
        />
      </div>
      {status === "idle" ? (
        <>
          <p className="text-body-md text-on-surface font-medium mb-1">
            Seret & taruh file di sini
          </p>
          <p className="text-body-sm text-outline mb-4">
            or klik untuk pilih file from your computer
          </p>
          <span className="text-label-caps text-outline">
            JPG, PNG, PDF · max 5MB
          </span>
        </>
      ) : status === "uploading" ? (
        <p className="text-body-md text-on-surface">Uploading {fileName}...</p>
      ) : status === "done" ? (
        <>
          <p className="text-body-md text-on-surface font-medium mb-1">
            {fileName} uploaded
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="text-body-sm text-primary font-semibold mt-2"
          >
            Replace
          </button>
        </>
      ) : (
        <>
          <p className="text-body-md text-on-error-container font-medium mb-1">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="text-body-sm text-primary font-semibold mt-2"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
