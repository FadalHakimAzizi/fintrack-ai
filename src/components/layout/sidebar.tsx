"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useApp } from "@/lib/app-provider";

const NAV_ITEMS = [
  { key: "nav.dashboard",    href: "/dashboard",    icon: "dashboard" },
  { key: "nav.transactions", href: "/transactions", icon: "receipt_long" },
  { key: "nav.analytics",    href: "/analytics",    icon: "leaderboard" },
  { key: "nav.ai",           href: "/ai",           icon: "smart_toy" },
  { key: "nav.budgets",      href: "/budgets",      icon: "account_balance_wallet" },
  { key: "nav.goals",        href: "/goals",        icon: "savings" },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { t, sidebarOpen, setSidebarOpen, collapsed } = useApp();
  const initials = (userEmail || "U").split("@")[0].slice(0, 2).toUpperCase();
  const settingsActive = pathname === "/settings" || Boolean(pathname?.startsWith("/settings/"));

  const close = () => setSidebarOpen(false);
  const hide = collapsed ? "md:hidden" : ""; // hide labels on desktop when collapsed
  const center = collapsed ? "md:justify-center md:px-0" : "";

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <nav
        className={cn(
          "fixed left-0 top-0 z-40 flex h-[100dvh] flex-col p-3",
          "bg-surface-container-lowest/90 backdrop-blur-xl",
          "border-r border-outline-variant/40",
          "w-64", // mobile drawer width
          collapsed ? "md:w-20" : "md:w-64",
          "transition-[width,transform] duration-300 ease-in-out",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className={cn("mb-6 flex h-11 items-center gap-2.5 px-1.5", center)}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-surface-tint text-on-primary shadow-xs ring-1 ring-inset ring-white/15">
            <Icon name="account_balance_wallet" filled />
          </div>
          <h1 className={cn("truncate font-h1 text-h3 tracking-tight text-primary", hide)}>
            FinTrack AI
          </h1>
          <button
            onClick={close}
            aria-label="Tutup menu navigasi"
            className="ml-auto grid h-10 w-10 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container md:hidden"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* User chip */}
        <div
          className={cn(
            "mb-5 flex items-center gap-3 rounded-2xl bg-surface-container/50 p-2",
            collapsed && "md:bg-transparent md:p-0 md:justify-center",
          )}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-on-primary-fixed-variant text-body-sm font-bold text-on-primary">
            {initials}
          </div>
          <div className={cn("min-w-0", hide)}>
            <div className="truncate text-body-sm font-semibold text-on-surface">
              {userEmail ? userEmail.split("@")[0] : "Guest"}
            </div>
            <div className="truncate text-label-caps text-outline">
              {userEmail || "Belum masuk"}
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          href="/transactions/new"
          onClick={close}
          title={t("nav.addTransaction")}
          className={cn(
            "mb-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-on-primary-fixed-variant px-4 py-3 text-body-md font-semibold text-on-primary shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99]",
            collapsed && "md:mx-auto md:h-11 md:w-11 md:px-0 md:py-0",
          )}
        >
          <Icon name="add" />
          <span className={cn(hide)}>{t("nav.addTransaction")}</span>
        </Link>

        {/* Section label */}
        <p className={cn("mb-1 px-3 text-label-caps uppercase tracking-wider text-outline/70", collapsed && "md:hidden")}>
          Menu
        </p>

        {/* Nav items */}
        <div className="no-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                title={t(item.key)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-md transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "bg-primary/[0.08] text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface",
                  center,
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon name={item.icon} filled={active} />
                <span className={cn("truncate", hide)}>{t(item.key)}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer — Settings is pinned here so it's always visible without scrolling */}
        <div className="mt-3 space-y-0.5 border-t border-outline-variant/30 pt-3">
          <Link
            href="/settings"
            onClick={close}
            aria-current={settingsActive ? "page" : undefined}
            title={t("nav.settings")}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-md transition-colors duration-200",
              settingsActive
                ? "bg-primary/[0.08] text-primary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface",
              center,
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200",
                settingsActive ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon name="settings" filled={settingsActive} />
            <span className={cn("truncate", hide)}>{t("nav.settings")}</span>
          </Link>
          <ThemeToggle collapsed={collapsed} />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title={t("nav.logout")}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-md text-on-surface-variant transition-colors hover:bg-error-container/60 hover:text-error",
                center,
              )}
            >
              <Icon name="logout" />
              <span className={cn(hide)}>{t("nav.logout")}</span>
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
