"use client";

import { useApp } from "@/lib/app-provider";
import { Icon } from "@/components/ui/icon";

export function TopBar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { setSidebarOpen } = useApp();

  return (
    <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden w-9 h-9 rounded-full grid place-items-center text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
        >
          <Icon name="menu" />
        </button>
        <div className="min-w-0">
          <h2 className="text-h3 md:text-h2 font-h2 text-on-surface truncate">{title}</h2>
          {subtitle && (
            <p className="text-body-sm text-outline mt-0.5 hidden sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {action}
        <button className="text-on-surface-variant hover:bg-surface-container p-2 rounded-full transition-colors">
          <Icon name="notifications" />
        </button>
      </div>
    </header>
  );
}
