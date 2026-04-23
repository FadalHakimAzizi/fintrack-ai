"use client";

import { useApp } from "@/lib/app-provider";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode, t } = useApp();

  return (
    <button
      onClick={toggleMode}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-body-md transition-colors",
        "text-on-surface-variant hover:bg-surface-container",
        className,
      )}
    >
      <Icon name={mode === "light" ? "dark_mode" : "light_mode"} />
      {mode === "light" ? t("appearance.darkMode") : t("appearance.lightMode")}
    </button>
  );
}
