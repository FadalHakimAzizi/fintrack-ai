"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";

interface ToastOptions {
  message: string;
  tone?: Tone;
  /** Optional action (e.g. Undo). Auto-dismiss pauses long enough to use it. */
  action?: { label: string; onClick: () => void | Promise<void> };
  /** ms before auto-dismiss. Default 4000 (6000 when an action is present). */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "action" | "duration">> {
  id: number;
  action?: ToastOptions["action"];
  duration: number;
}

const ToastContext = createContext<(o: ToastOptions) => void>(() => {});

const TONE: Record<Tone, { icon: string; ring: string; fg: string }> = {
  success: { icon: "check_circle", ring: "text-secondary", fg: "text-secondary" },
  error: { icon: "error", ring: "text-error", fg: "text-error" },
  info: { icon: "info", ring: "text-primary", fg: "text-primary" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((o: ToastOptions) => {
    const id = ++idRef.current;
    const duration = o.duration ?? (o.action ? 6000 : 4000);
    setItems((prev) => [
      ...prev,
      { id, message: o.message, tone: o.tone ?? "info", action: o.action, duration },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const tone = TONE[item.tone];

  const close = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDismiss, 180);
  }, [onDismiss]);

  useEffect(() => {
    const id = window.setTimeout(close, item.duration);
    return () => window.clearTimeout(id);
  }, [close, item.duration]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 shadow-elevated",
        "transition-all duration-200 ease-out",
        leaving ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
      )}
    >
      <Icon name={tone.icon} filled className={cn("shrink-0", tone.fg)} />
      <p className="flex-1 text-body-sm text-on-surface">{item.message}</p>
      {item.action && (
        <button
          type="button"
          onClick={async () => {
            await item.action!.onClick();
            close();
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-body-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={close}
        aria-label="Tutup notifikasi"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  );
}

export const useToast = () => useContext(ToastContext);
