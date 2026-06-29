"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type MicState = "idle" | "recording" | "transcribing" | "error";
type Mode = "live" | "record" | null;

interface VoiceInputProps {
  /** Full spoken text so far (interim or final) — caller appends to its base. */
  onText: (text: string) => void;
  /** Called when listening begins, so the caller can snapshot existing input. */
  onStart?: () => void;
  lang?: string;
  disabled?: boolean;
  className?: string;
}

const SR_ERRORS: Record<string, string> = {
  "not-allowed": "Izinkan akses mikrofon di browser",
  "service-not-allowed": "Akses mikrofon diblokir",
  network: "Perlu koneksi internet untuk kenali suara",
  "audio-capture": "Mikrofon tidak terdeteksi",
};

// Whisper picks its decoder from the file extension, so the name must match the
// actual recording container (Safari records mp4, Chrome webm, etc.).
function audioFilename(mime: string): string {
  if (mime.includes("ogg")) return "audio.ogg";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) return "audio.mp4";
  if (mime.includes("wav")) return "audio.wav";
  return "audio.webm";
}

/**
 * Voice input with two modes:
 *  - "live"   → Web Speech API, real-time interim results (Chrome/Edge).
 *  - "record" → MediaRecorder → /api/transcribe (Groq Whisper), batch result —
 *               fallback for browsers without the Web Speech API.
 */
export function VoiceInput({ onText, onStart, lang = "id-ID", disabled, className }: VoiceInputProps) {
  const [state, setState] = useState<MicState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [seconds, setSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Prefer the reliable record→Groq path (works in every browser). Web Speech
    // is only used where MediaRecorder is unavailable — it's flaky/disabled in
    // several browsers (e.g. Brave), which broke the mic for some users.
    if (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof window.MediaRecorder !== "undefined"
    ) {
      setMode("record");
    } else if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      setMode("live");
    } else {
      setMode(null);
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      stopStream();
    },
    [stopStream],
  );

  // Recording-duration ticker
  useEffect(() => {
    if (state !== "recording") {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);
  const mmss = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  function showError(msg: string) {
    setErrorMsg(msg);
    setState("error");
    setTimeout(() => setState((s) => (s === "error" ? "idle" : s)), 5000);
  }

  // ── LIVE (Web Speech API) ──
  function startLive() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => {
      onStart?.();
      setErrorMsg(null);
      setState("recording");
    };
    rec.onresult = (ev) => {
      let txt = "";
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0]?.transcript ?? "";
      onText(txt.trim());
    };
    rec.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") {
        setState("idle");
        return;
      }
      showError(SR_ERRORS[ev.error] || `Gagal: ${ev.error}`);
    };
    rec.onend = () => setState((s) => (s === "recording" ? "idle" : s));

    try {
      rec.start();
    } catch {
      setState("idle");
    }
  }

  function stopLive() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }

  // ── RECORD (MediaRecorder → Groq Whisper) ──
  async function transcribe(blob: Blob, filename: string) {
    setState("transcribing");
    try {
      const fd = new FormData();
      fd.append("file", blob, filename);
      fd.append("language", lang);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return showError(data.error || "Transkripsi gagal");
      const text = (data.text || "").trim();
      if (text) onText(text);
      else showError("Tidak ada suara terdeteksi");
      setState((s) => (s === "transcribing" ? "idle" : s));
    } catch (e) {
      showError(e instanceof Error ? e.message : "Gagal mengirim audio");
    }
  }

  async function startRecord() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      onStart?.();
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
          ? "audio/ogg"
          : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stopStream();
        const m = recorder.mimeType || "audio/webm";
        const dur = Date.now() - recordStartRef.current;
        const blob = new Blob(chunksRef.current, { type: m });
        // Whisper hallucinates random phrases on very short / near-silent clips.
        if (dur < 1000 || blob.size < 2048) {
          showError("Rekaman terlalu singkat — tahan lebih lama lalu coba lagi.");
          setState("idle");
          return;
        }
        transcribe(blob, audioFilename(m));
      };
      recordStartRef.current = Date.now();
      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch (err) {
      stopStream();
      const name = err instanceof DOMException ? err.name : "";
      showError(
        name === "NotAllowedError"
          ? "Izinkan akses mikrofon di browser"
          : name === "NotFoundError"
            ? "Mikrofon tidak terdeteksi"
            : "Tidak bisa mengakses mikrofon",
      );
    }
  }

  function stopRecord() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
  }

  function onClick() {
    if (disabled || state === "transcribing") return;
    if (state === "recording") {
      mode === "live" ? stopLive() : stopRecord();
    } else {
      mode === "live" ? startLive() : startRecord();
    }
  }

  if (!mode) {
    return (
      <button
        type="button"
        disabled
        title="Browser tidak mendukung input suara"
        className="grid h-10 w-10 cursor-not-allowed place-items-center rounded-xl text-on-surface-variant/40"
      >
        <Icon name="mic_off" />
      </button>
    );
  }

  const busy = state === "transcribing";

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        title={state === "recording" ? "Berhenti" : "Rekam suara"}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl transition-colors",
          state === "recording"
            ? "bg-error text-on-error"
            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
          (disabled || busy) && "opacity-50",
        )}
      >
        {state === "recording" && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-xl bg-error/40" />
        )}
        <Icon
          name={busy ? "progress_activity" : state === "recording" ? "stop" : "mic"}
          filled={state === "recording"}
          className={cn("relative", busy && "animate-spin")}
        />
      </button>

      {state === "recording" && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-error px-2.5 py-1 text-label-caps tabular text-on-error shadow-elevated">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-error" />
          {mmss}
        </div>
      )}

      {state === "error" && errorMsg && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-error px-3 py-1 text-label-caps text-on-error shadow-elevated">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
