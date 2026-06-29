"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { VoiceInput } from "@/components/ai/voice-input";
import {
  TransactionPreviewCard,
  type ParsedTransaction,
} from "@/components/ai/transaction-preview-card";
import { ChatChart, type ChatChartData } from "@/components/ai/chat-chart";
import { useApp } from "@/lib/app-provider";

interface AttachedFile {
  file: File;
  previewUrl: string;
  uploadedUrl: string;
  uploadedPath: string;
  uploading: boolean;
  error?: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  parsedTransaction?: ParsedTransaction;
  imagePreviewUrl?: string;
  attachmentUrl?: string;
  attachmentPath?: string;
  transactionDiscarded?: boolean;
  transactionSaved?: boolean;
  savedTransactionId?: string | null;
  chart?: ChatChartData;
  retrievedCount?: number;
}

const STORAGE_KEY = "fintrack.ai.chat.v1";

// Grouped by intent for the empty-state launcher.
const SUGGESTION_GROUPS = [
  {
    icon: "edit_note",
    title: "Catat transaksi",
    chip: "bg-primary/12 text-primary",
    items: [
      "Catat pengeluaran 50rb makan siang di warteg",
      "Gajian 5 juta hari ini",
    ],
  },
  {
    icon: "insights",
    title: "Analisa keuangan",
    chip: "bg-secondary/15 text-secondary",
    items: [
      "Berapa total pengeluaran sepanjang tahun ini?",
      "Kategori mana yang paling besar selama ini?",
    ],
  },
  {
    icon: "compare_arrows",
    title: "Bandingkan",
    chip: "bg-tertiary/15 text-tertiary",
    items: [
      "Bandingkan pengeluaran bulan ini vs bulan lalu",
      "Tren pemasukan 6 bulan terakhir",
    ],
  },
] as const;

// Compact chips shown above the input mid-conversation.
const QUICK = [
  "Ringkas keuangan saya",
  "Total pengeluaran bulan ini",
  "Kategori terbesar",
  "Tips hemat untuk saya",
];

const LOCALE_TO_SPEECH: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  ar: "ar-SA",
};

function parseTransactionBlock(raw: string): {
  displayText: string;
  parsedTransaction: ParsedTransaction | null;
} {
  const TAG_RE = /<TRANSACTION>([\s\S]*?)<\/TRANSACTION>/i;
  const match = TAG_RE.exec(raw);
  if (!match) return { displayText: raw, parsedTransaction: null };

  const jsonStr = match[1].trim();
  let parsed: ParsedTransaction | null = null;
  try {
    const obj = JSON.parse(jsonStr);
    if (
      (obj.transaction_type === "income" || obj.transaction_type === "expense") &&
      typeof obj.amount === "number" &&
      obj.amount > 0
    ) {
      parsed = {
        transaction_type: obj.transaction_type,
        amount: obj.amount,
        currency: obj.currency || "IDR",
        transaction_date:
          obj.transaction_date || new Date().toISOString().slice(0, 10),
        merchant_name: obj.merchant_name ?? null,
        item_name: obj.item_name ?? null,
        category: obj.category ?? null,
        payment_method: obj.payment_method ?? null,
        notes: obj.notes ?? null,
      };
    }
  } catch {
    // malformed JSON — ignore
  }

  const displayText = raw.replace(TAG_RE, "").trim();
  return { displayText: displayText || "Berikut transaksi yang terdeteksi:", parsedTransaction: parsed };
}

// Optional <CHART>{...}</CHART> block the model emits for numeric breakdowns.
function parseChartBlock(raw: string): { text: string; chart: ChatChartData | null } {
  const RE = /<CHART>([\s\S]*?)<\/CHART>/i;
  const m = RE.exec(raw);
  if (!m) return { text: raw, chart: null };

  let chart: ChatChartData | null = null;
  try {
    const obj = JSON.parse(m[1].trim());
    if (Array.isArray(obj.data)) {
      const data = obj.data
        .filter((d: unknown): d is { label: unknown; value: unknown } =>
          Boolean(d) && typeof d === "object",
        )
        .map((d: { label: unknown; value: unknown }) => ({
          label: String(d.label ?? ""),
          value: Number(d.value),
        }))
        .filter((d: { label: string; value: number }) => d.label && Number.isFinite(d.value))
        .slice(0, 12);
      if (data.length) {
        chart = {
          type: typeof obj.type === "string" ? obj.type : "bar",
          title: typeof obj.title === "string" ? obj.title : undefined,
          unit: typeof obj.unit === "string" ? obj.unit : undefined,
          data,
        };
      }
    }
  } catch {
    // malformed JSON — ignore
  }

  const text = raw.replace(RE, "").trim();
  return { text, chart };
}

// During streaming, hide any (possibly partial) <TRANSACTION>/<CHART> block so
// raw tags never flash in the bubble — the full parse happens once complete.
function stripBlocks(raw: string): string {
  const lower = raw.toLowerCase();
  const i1 = lower.indexOf("<transaction");
  const i2 = lower.indexOf("<chart");
  const cut = Math.min(i1 === -1 ? Infinity : i1, i2 === -1 ? Infinity : i2);
  return (cut === Infinity ? raw : raw.slice(0, cut)).trimEnd();
}

const FOLLOWUPS = [
  "Jelaskan lebih detail",
  "Tampilkan grafiknya",
  "Bandingkan vs bulan lalu",
  "Beri tips hemat",
];

// ── Lightweight markdown: **bold**, bullet (- * •) and numbered (1.) lists ──
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-on-surface">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
const isTableSeparator = (s: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(s) && s.includes("-");
const splitTableRow = (s: string) =>
  s.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function renderRich(text: string) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let key = 0;

  const flush = () => {
    if (!list) return;
    const items = list.items.map((it, i) => (
      <li key={i}>{renderInline(it, `li-${key}-${i}`)}</li>
    ));
    blocks.push(
      list.type === "ul" ? (
        <ul key={`b-${key++}`} className="list-disc space-y-1 pl-5 marker:text-outline">
          {items}
        </ul>
      ) : (
        <ol key={`b-${key++}`} className="list-decimal space-y-1 pl-5 marker:text-outline">
          {items}
        </ol>
      ),
    );
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Markdown table: header row + separator + body rows
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flush();
      const header = splitTableRow(line);
      const body: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j])) {
        body.push(splitTableRow(lines[j]));
        j++;
      }
      i = j - 1;
      blocks.push(<TableBlock key={`t-${key++}`} header={header} body={body} />);
      continue;
    }

    const heading = line.match(/^\s*(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*•+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);

    if (heading) {
      flush();
      blocks.push(
        <p key={`h-${key++}`} className="pt-1 font-h2 text-body-lg text-on-surface">
          {renderInline(heading[2], `h-${key}`)}
        </p>,
      );
    } else if (bullet) {
      if (!list || list.type !== "ul") {
        flush();
        list = { type: "ul", items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered) {
      if (!list || list.type !== "ol") {
        flush();
        list = { type: "ol", items: [] };
      }
      list.items.push(numbered[1]);
    } else {
      flush();
      if (line.trim() === "") blocks.push(<div key={`sp-${key++}`} className="h-1.5" />);
      else blocks.push(<p key={`b-${key++}`}>{renderInline(line, `p-${key}`)}</p>);
    }
  }
  flush();
  return <div className="space-y-1.5">{blocks}</div>;
}

function TableBlock({ header, body }: { header: string[]; body: string[][] }) {
  return (
    <div className="my-1 overflow-x-auto rounded-lg border border-outline-variant/40">
      <table className="w-full border-collapse text-body-sm">
        <thead className="bg-surface-container-low">
          <tr>
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-on-surface">
                {renderInline(h, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="border-t border-outline-variant/30">
              {row.map((c, ci) => (
                <td
                  key={ci}
                  className={cn(
                    "px-3 py-2 text-on-surface-variant",
                    ci > 0 && "tabular text-right",
                  )}
                >
                  {renderInline(c, `td-${r}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChatPanel() {
  const { locale } = useApp();
  const speechLang = LOCALE_TO_SPEECH[locale] || "en-US";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<AttachedFile | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [restored, setRestored] = useState(false);
  const [ragActive, setRagActive] = useState<boolean | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Restore prior conversation (blob image URLs don't survive reload, so they're
  // dropped on save — text + parsed transactions are what matter).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Msg[];
        if (Array.isArray(saved) && saved.length) setMessages(saved);
      }
    } catch {}
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored || streaming) return; // skip per-token writes; save once when done
    try {
      if (messages.length === 0) localStorage.removeItem(STORAGE_KEY);
      else
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(messages.map((m) => ({ ...m, imagePreviewUrl: undefined }))),
        );
    } catch {}
  }, [messages, restored, streaming]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: streaming ? "auto" : "smooth",
    });
  }, [messages, loading, streaming]);

  // Revoke all created object URLs only when the panel unmounts.
  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  // Probe whether RAG is genuinely active (provider responds).
  useEffect(() => {
    let alive = true;
    fetch("/api/rag-status")
      .then((r) => r.json())
      .then((d) => alive && setRagActive(Boolean(d.enabled)))
      .catch(() => alive && setRagActive(false));
    return () => {
      alive = false;
    };
  }, []);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      setError("Hanya gambar JPG atau PNG yang didukung.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File terlalu besar (maks 5MB).");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(previewUrl);
    setAttachment({
      file,
      previewUrl,
      uploadedUrl: "",
      uploadedPath: "",
      uploading: true,
    });
    setError(null);

    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        setAttachment((prev) =>
          prev ? { ...prev, uploading: false, error: txt || "Upload gagal" } : null,
        );
        return;
      }
      const { path, url } = (await res.json()) as { path: string; url: string };
      setAttachment((prev) =>
        prev ? { ...prev, uploading: false, uploadedUrl: url, uploadedPath: path } : null,
      );
    } catch (err) {
      setAttachment((prev) =>
        prev
          ? {
              ...prev,
              uploading: false,
              error: err instanceof Error ? err.message : "Upload gagal",
            }
          : null,
      );
    }
  }

  function removeAttachment() {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
      objectUrlsRef.current.delete(attachment.previewUrl);
    }
    setAttachment(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    const hasImage = attachment && !attachment.uploading && attachment.uploadedUrl;
    if ((!trimmed && !hasImage) || loading) return;
    if (attachment?.uploading) return;

    const currentAttachment = attachment;
    const imageUrl = currentAttachment?.uploadedUrl || undefined;
    const imagePath = currentAttachment?.uploadedPath || undefined;
    const previewUrl = currentAttachment?.previewUrl;

    const userContent = trimmed || (imageUrl ? "Tolong analisa struk ini." : "");

    const userMsg: Msg = {
      role: "user",
      content: userContent,
      imagePreviewUrl: previewUrl,
      attachmentUrl: imageUrl,
      attachmentPath: imagePath,
    };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setAttachment(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          imageUrl,
        }),
      });

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => "");
        let msg = txt;
        try {
          msg = JSON.parse(txt).error || txt;
        } catch {}
        setError(msg || `Request failed (${res.status})`);
        return;
      }

      const retrievedCount = Number(res.headers.get("X-Retrieved") || 0);

      // Stream tokens into a live-growing assistant bubble.
      setStreaming(true);
      setMessages([...next, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let raw = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        const display = stripBlocks(raw);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: display };
          return copy;
        });
      }

      // Finalize: parse transaction/chart blocks from the full text.
      const { displayText, parsedTransaction } = parseTransactionBlock(raw);
      const { text, chart } = parseChartBlock(displayText);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: text,
          parsedTransaction: parsedTransaction ?? undefined,
          chart: chart ?? undefined,
          retrievedCount,
        };
        return copy;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  }

  async function confirmTransaction(msgIndex: number) {
    const msg = messages[msgIndex];
    if (!msg.parsedTransaction || msg.transactionSaved) return; // guard double-save

    const prevUser = messages[msgIndex - 1];

    const payload = {
      ...msg.parsedTransaction,
      attachment_path: prevUser?.attachmentPath ?? null,
      attachment_url: prevUser?.attachmentUrl ?? null,
    };

    const res = await fetch("/api/chat-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(json.error || `HTTP ${res.status}`);
    }

    // Persist the saved state (+ id) so it survives reload and can't be re-saved.
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIndex
          ? { ...m, transactionSaved: true, savedTransactionId: json.id ?? null }
          : m,
      ),
    );
  }

  function discardTransaction(msgIndex: number) {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, transactionDiscarded: true } : m)),
    );
  }

  function undiscardTransaction(msgIndex: number) {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, transactionDiscarded: false } : m)),
    );
  }

  function copyMessage(text: string, idx: number) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    });
  }

  function speakMessage(text: string, idx: number) {
    if (!("speechSynthesis" in window)) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 1.0;
    utterance.onstart = () => setSpeakingIdx(idx);
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    window.speechSynthesis.speak(utterance);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setMessages([]);
    setInput("");
    setError(null);
    removeAttachment();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    textareaRef.current?.focus();
  }

  const voiceBaseRef = useRef("");
  function handleVoiceStart() {
    voiceBaseRef.current = input.trim();
  }
  function handleVoiceText(t: string) {
    const base = voiceBaseRef.current;
    setInput(base ? `${base} ${t}` : t);
  }

  function exportChat() {
    if (messages.length === 0) return;
    const text = messages
      .map((m) => `${m.role === "user" ? "Anda" : "Asisten"}: ${m.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `percakapan-ai-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const showEmptyState = messages.length === 0 && !loading;
  const canSend = !loading && !attachment?.uploading && (input.trim() || attachment?.uploadedUrl);
  const showQuick = !showEmptyState && !loading && !input.trim() && !attachment;

  return (
    <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col">
      {/* Top toolbar — RAG status + reset, always visible */}
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/40 px-4 py-2.5 sm:px-6">
        {ragActive === null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-label-caps font-medium text-on-surface-variant">
            <Icon name="progress_activity" className="animate-spin text-[14px]" />
            Memeriksa RAG…
          </span>
        ) : ragActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/12 px-2.5 py-1 text-label-caps font-semibold text-secondary">
            <Icon name="auto_awesome" filled className="text-[14px]" />
            RAG aktif · seluruh riwayat
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-tertiary/15 px-2.5 py-1 text-label-caps font-medium text-tertiary"
            title="Embedding tidak aktif — chat tetap jalan memakai ringkasan & transaksi terbaru"
          >
            <Icon name="info" filled className="text-[14px]" />
            RAG nonaktif
          </span>
        )}
        {messages.length > 0 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={exportChat}
              title="Ekspor percakapan"
              aria-label="Ekspor percakapan"
              className="grid h-9 w-9 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <Icon name="download" className="text-[20px]" />
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline/30 bg-surface-container-low px-3 py-1.5 text-body-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <Icon name="restart_alt" className="text-[18px]" />
              Mulai ulang
            </button>
          </div>
        ) : null}
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-6 px-4 py-6 sm:px-6">
        {showEmptyState ? (
          <EmptyState onPick={(s) => send(s)} />
        ) : (
          messages.map((m, i) => (
            <div key={i} className="animate-fade-up space-y-2">
              <MessageBubble
                msg={m}
                isSpeaking={speakingIdx === i}
                isCopied={copiedIdx === i}
                onSpeak={() => speakMessage(m.content, i)}
                onCopy={() => copyMessage(m.content, i)}
              />
              {m.role === "assistant" && m.chart ? (
                <div className="ml-11 animate-fade-up sm:ml-12">
                  <ChatChart chart={m.chart} />
                </div>
              ) : null}
              {m.role === "assistant" && m.parsedTransaction ? (
                <div className="ml-11 sm:ml-12">
                  {m.transactionDiscarded ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/60 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                        <Icon name="block" className="text-[18px]" />
                        Transaksi diabaikan
                      </span>
                      <button
                        type="button"
                        onClick={() => undiscardTransaction(i)}
                        className="inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:underline"
                      >
                        <Icon name="undo" className="text-[18px]" />
                        Urungkan
                      </button>
                    </div>
                  ) : (
                    <TransactionPreviewCard
                      data={m.parsedTransaction}
                      saved={m.transactionSaved}
                      savedId={m.savedTransactionId}
                      onConfirm={() => confirmTransaction(i)}
                      onDiscard={() => discardTransaction(i)}
                    />
                  )}
                </div>
              ) : null}
              {i === messages.length - 1 && m.role === "assistant" && !loading && !streaming ? (
                <div className="ml-11 flex flex-wrap gap-2 pt-1 sm:ml-12">
                  {FOLLOWUPS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => send(f)}
                      className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Icon name="subdirectory_arrow_right" className="text-[14px]" />
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
        {loading && !streaming ? <TypingBubble /> : null}
        {error ? (
          <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            <Icon name="error" filled />
            {error}
          </div>
        ) : null}
        </div>
      </div>

      {/* Scroll-to-bottom */}
      {!atBottom && messages.length > 0 ? (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Gulir ke bawah"
          className="absolute bottom-32 left-1/2 z-10 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant shadow-elevated transition-colors hover:text-on-surface"
        >
          <Icon name="arrow_downward" />
        </button>
      ) : null}

      <div className="shrink-0 border-t border-outline-variant/50 bg-surface-container-lowest/80 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="space-y-3">
        {showQuick ? (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Icon name="bolt" className="text-[16px]" />
                {q}
              </button>
            ))}
          </div>
        ) : null}

        {attachment && (
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container p-2">
            <img src={attachment.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm text-on-surface">{attachment.file.name}</p>
              <p className="flex items-center gap-1 text-label-caps text-outline">
                {attachment.uploading ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin text-[14px]" />
                    Mengunggah…
                  </>
                ) : attachment.error ? (
                  attachment.error
                ) : (
                  <>
                    <Icon name="check_circle" className="text-[14px] text-secondary" />
                    Siap dikirim
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={removeAttachment}
              className="grid h-9 w-9 place-items-center rounded-lg text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
              title="Hapus lampiran"
            >
              <Icon name="close" />
            </button>
          </div>
        )}

        {/* Unified input bar */}
        <div className="flex items-end gap-1.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-card transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || !!attachment}
            title="Lampirkan struk/gambar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
          >
            <Icon name="add_photo_alternate" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            onChange={onFileSelect}
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tanya atau catat transaksi…"
            rows={1}
            className="max-h-40 flex-1 resize-none border-0 bg-transparent px-1.5 py-2.5 text-body-md text-on-surface outline-none placeholder:text-outline/60"
            disabled={loading}
          />

          <VoiceInput onStart={handleVoiceStart} onText={handleVoiceText} lang={speechLang} disabled={loading} />

          <button
            type="button"
            onClick={() => send(input)}
            disabled={!canSend}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary shadow-xs transition-all hover:shadow-card disabled:opacity-40 disabled:shadow-none"
            title="Kirim"
          >
            <Icon name={loading ? "progress_activity" : "send"} filled className={cn(loading && "animate-spin")} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-label-caps text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Kbd>Enter</Kbd> kirim
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Shift</Kbd>
            <span className="text-outline">+</span>
            <Kbd>Enter</Kbd> baris baru
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="mic" className="text-[14px]" />
            suara
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="photo_camera" className="text-[14px]" />
            lampir struk
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-outline-variant/60 bg-surface-container px-1.5 py-0.5 font-sans text-[11px] font-semibold leading-none text-on-surface">
      {children}
    </kbd>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-12">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary shadow-elevated ring-1 ring-inset ring-white/15">
          <Icon name="smart_toy" filled className="text-[32px]" />
        </div>
        <h3 className="font-display text-h2 tracking-tight text-on-surface">
          Halo! Saya asisten keuanganmu.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">
          Tanyakan apa saja soal keuanganmu, catat transaksi lewat teks atau suara, atau
          kirim foto struk untuk auto-isi.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary/12 px-3 py-1 text-body-sm font-medium text-secondary">
          <Icon name="all_inclusive" className="text-[16px]" />
          Menganalisis seluruh riwayat transaksi
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUGGESTION_GROUPS.map((g) => (
          <div
            key={g.title}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-card"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg", g.chip)}>
                <Icon name={g.icon} filled />
              </span>
              <span className="text-body-md font-semibold text-on-surface">{g.title}</span>
            </div>
            <div className="space-y-2">
              {g.items.map((s) => (
                <button
                  key={s}
                  onClick={() => onPick(s)}
                  className="group flex w-full items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low/50 px-3 py-2 text-left text-body-sm text-on-surface transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
                >
                  <span className="line-clamp-2 flex-1">{s}</span>
                  <Icon
                    name="arrow_outward"
                    className="shrink-0 text-[18px] text-outline opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isSpeaking,
  isCopied,
  onSpeak,
  onCopy,
}: {
  msg: Msg;
  isSpeaking: boolean;
  isCopied: boolean;
  onSpeak: () => void;
  onCopy: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-sm ring-1 ring-inset ring-white/10",
          isUser
            ? "bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary"
            : "bg-gradient-to-br from-secondary to-secondary/70 text-on-secondary",
        )}
      >
        <Icon name={isUser ? "person" : "smart_toy"} filled />
      </div>
      <div className={cn("flex max-w-[82%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {!isUser && msg.retrievedCount ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-label-caps font-medium text-primary">
            <Icon name="search" className="text-[14px]" />
            {msg.retrievedCount} transaksi relevan ditemukan
          </span>
        ) : null}
        {isUser && msg.imagePreviewUrl && (
          <img
            src={msg.imagePreviewUrl}
            alt="attachment"
            className="max-h-48 rounded-xl border border-outline-variant/30 object-contain"
          />
        )}
        {msg.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-body-md break-words",
              isUser
                ? "rounded-tr-sm bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary"
                : "rounded-tl-sm border border-outline-variant/30 bg-surface-container-lowest text-on-surface shadow-card",
            )}
          >
            {isUser ? <span className="whitespace-pre-wrap">{msg.content}</span> : renderRich(msg.content)}
          </div>
        )}
        {!isUser && msg.content && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onCopy}
              title={isCopied ? "Tersalin" : "Salin"}
              className={cn(
                "rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-on-surface",
                isCopied && "text-secondary",
              )}
            >
              <Icon name={isCopied ? "check" : "content_copy"} className="text-[18px]" />
            </button>
            <button
              type="button"
              onClick={onSpeak}
              title={isSpeaking ? "Berhenti" : "Bacakan"}
              className={cn(
                "rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container hover:text-primary",
                isSpeaking && "text-primary",
              )}
            >
              <Icon name={isSpeaking ? "stop_circle" : "volume_up"} filled={isSpeaking} className="text-[18px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-secondary to-secondary/70 text-on-secondary shadow-sm ring-1 ring-inset ring-white/10">
        <Icon name="smart_toy" filled />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-outline-variant/30 bg-surface-container-lowest px-4 py-3.5 shadow-card">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-outline [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-outline [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-outline" />
        </div>
      </div>
    </div>
  );
}
