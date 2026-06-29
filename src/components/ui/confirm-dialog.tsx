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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
}

type Resolver = (ok: boolean) => void;

const ConfirmContext = createContext<(o: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<Resolver | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOpts(null);
  }, []);

  // Esc to cancel + focus the confirm button on open.
  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    document.addEventListener("keydown", onKey);
    confirmBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [opts, settle]);

  const danger = opts?.tone !== "primary";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => settle(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-elevated">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                  danger
                    ? "bg-error-container text-on-error-container"
                    : "bg-primary-container/15 text-primary",
                )}
              >
                <Icon name={danger ? "warning" : "help"} filled />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-title"
                  className="text-h3 font-h3 text-on-surface"
                >
                  {opts.title}
                </h2>
                {opts.description && (
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    {opts.description}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => settle(false)}>
                {opts.cancelLabel || "Batal"}
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={danger ? "danger" : "primary"}
                size="sm"
                onClick={() => settle(true)}
              >
                {opts.confirmLabel || "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
