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
  { key: "nav.settings",     href: "/settings",     icon: "settings" },
];

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const { t, sidebarOpen, setSidebarOpen } = useApp();
  const initials = (userEmail || "U").split("@")[0].slice(0, 2).toUpperCase();

  function close() { setSidebarOpen(false); }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={close}
        />
      )}

      <nav className={cn(
        "bg-surface-container-lowest text-primary h-screen w-64 fixed left-0 top-0 z-40",
        "border-r border-outline-variant flex flex-col p-4 space-y-2",
        "transition-transform duration-300 ease-in-out",
        // Mobile: hidden by default, slide in when open
        // Desktop: always visible
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-h1 text-h1 text-primary tracking-tight">FinTrack AI</h1>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="md:hidden w-8 h-8 rounded-full grid place-items-center text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-surface-container-low rounded-lg">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-body-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-body-md font-semibold text-on-surface truncate">
              {userEmail ? userEmail.split("@")[0] : "Guest"}
            </div>
            <div className="text-body-sm text-outline truncate">
              {userEmail || "Not signed in"}
            </div>
          </div>
        </div>

        <div className="flex-grow space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-body-md transition-all",
                  active
                    ? "bg-surface-container-high text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container hover:translate-x-1",
                )}
              >
                <Icon name={item.icon} filled={active} />
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        <Link
          href="/transactions/new"
          onClick={close}
          className="w-full bg-primary text-on-primary text-body-md font-medium py-3 px-4 rounded-lg hover:bg-on-primary-fixed-variant transition-colors mt-4 flex items-center justify-center gap-2"
        >
          <Icon name="add" />
          {t("nav.addTransaction")}
        </Link>

        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <ThemeToggle />
          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg text-body-md transition-colors"
          >
            <Icon name="help" />
            {t("nav.help")}
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container rounded-lg text-body-md transition-colors"
            >
              <Icon name="logout" />
              {t("nav.logout")}
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
