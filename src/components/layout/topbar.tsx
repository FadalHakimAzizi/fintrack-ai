"use client";

import Link from "next/link";
import { useApp } from "@/lib/app-provider";
import { Icon } from "@/components/ui/icon";

export function TopBar({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** When set, shows a back arrow linking to this path (for deep/sub pages). */
  back?: string;
}) {
  const { setSidebarOpen, toggleCollapsed, collapsed } = useApp();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-outline-variant/50 bg-surface-container-lowest/70 px-4 backdrop-blur-xl md:h-20 md:px-8">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        {/* Deep pages: back to the parent list/page */}
        {back ? (
          <Link
            href={back}
            aria-label="Kembali"
            title="Kembali"
            className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow_back" />
          </Link>
        ) : null}
        {/* Mobile: open drawer */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Buka menu navigasi"
          className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
        >
          <Icon name="menu" />
        </button>
        {/* Desktop: collapse / expand sidebar */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Luaskan sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Luaskan sidebar" : "Ciutkan sidebar"}
          className="-ml-1 hidden h-10 w-10 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container md:grid"
        >
          <Icon name={collapsed ? "menu" : "menu_open"} />
        </button>

        <div className="min-w-0">
          <h2 className="truncate text-h3 font-h2 tracking-tight text-on-surface md:text-h2">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 hidden truncate text-body-sm text-on-surface-variant sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 md:gap-2">{action}</div>
    </header>
  );
}
