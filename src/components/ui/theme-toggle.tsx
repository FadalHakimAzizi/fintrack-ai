"use client";

import { useApp } from "@/lib/app-provider";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  collapsed,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  const { mode, toggleMode, t } = useApp();
  const label = mode === "light" ? t("appearance.darkMode") : t("appearance.lightMode");

  return (
    <button
      onClick={toggleMode}
      title={label}
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-md transition-colors",
        "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        collapsed && "md:justify-center md:px-0",
        className,
      )}
    >
      <Icon name={mode === "light" ? "dark_mode" : "light_mode"} />
      <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
    </button>
  );
}
