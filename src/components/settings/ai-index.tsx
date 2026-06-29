"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function AiIndex() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [embedded, setEmbedded] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body?: object) {
    const res = await fetch("/api/embeddings/backfill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  async function run(reset = false) {
    setRunning(true);
    setError(null);
    setDone(false);
    setEmbedded(0);
    let total = 0;
    try {
      if (reset) {
        const r = await post({ reset: true }); // wipe old vectors first
        if (!r.ok) {
          setError(r.data.error || `Gagal reset (${r.status})`);
          setRunning(false);
          return;
        }
        setRemaining(r.data.remaining ?? null);
      }
      for (let i = 0; i < 4000; i++) {
        const { ok, status, data } = await post();
        if (!ok) {
          setError(data.error || `Gagal (${status})`);
          if (typeof data.remaining === "number") setRemaining(data.remaining);
          break;
        }
        total += data.embedded || 0;
        setEmbedded(total);
        setRemaining(data.remaining ?? 0);
        if (data.done) {
          setDone(true);
          break;
        }
        if ((data.embedded ?? 0) === 0) break; // nothing progressed — stop
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setRunning(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => run(false)} disabled={running}>
          <Icon
            name={running ? "progress_activity" : "manage_search"}
            className={running ? "animate-spin" : ""}
          />
          {running ? "Mengindeks…" : "Indeks transaksi untuk AI"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run(true)} disabled={running}>
          <Icon name="restart_alt" />
          Indeks ulang semua
        </Button>
        {running || embedded > 0 || done ? (
          <span className="text-body-sm text-on-surface-variant">
            {embedded} diindeks
            {remaining != null ? ` · ${remaining} tersisa` : ""}
          </span>
        ) : null}
      </div>

      {done ? (
        <p className="inline-flex items-center gap-1.5 text-body-sm font-medium text-secondary">
          <Icon name="check_circle" filled />
          Selesai — Asisten AI kini bisa mencari di seluruh riwayat secara semantik.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
          {error}
        </p>
      ) : null}

      <p className="text-body-sm text-on-surface-variant">
        <b>Indeks</b> membuat embedding untuk transaksi yang belum terindeks (transaksi baru
        terindeks otomatis). <b>Indeks ulang semua</b> menghapus embedding lama lalu membuat
        ulang — jalankan ini setiap kali Anda <b>ganti provider</b> embedding (mis. Ollama →
        Voyage), karena vektornya tidak sebanding antar-provider.
      </p>
    </div>
  );
}
