import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const CHIPS = {
  primary: "bg-primary/12 text-primary ring-primary/20",
  secondary: "bg-secondary/14 text-secondary ring-secondary/25",
  tertiary: "bg-tertiary/14 text-tertiary ring-tertiary/25",
  brand: "bg-gradient-to-br from-primary to-surface-tint text-on-primary ring-white/15",
} as const;

const ACTIONS: {
  href: string;
  icon: string;
  label: string;
  desc: string;
  tone: keyof typeof CHIPS;
}[] = [
  { href: "/transactions/new", icon: "add", label: "Transaksi Baru", desc: "Catat manual", tone: "primary" },
  { href: "/transactions/upload", icon: "document_scanner", label: "Scan Struk", desc: "Foto & auto-isi", tone: "secondary" },
  { href: "/budgets", icon: "account_balance_wallet", label: "Atur Budget", desc: "Batas per kategori", tone: "tertiary" },
  { href: "/ai", icon: "smart_toy", label: "Tanya AI", desc: "Asisten keuangan", tone: "brand" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="card-interactive group flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-card"
        >
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
              CHIPS[a.tone],
            )}
          >
            <Icon name={a.icon} filled />
          </span>
          <div className="min-w-0">
            <div className="truncate text-body-md font-semibold text-on-surface">{a.label}</div>
            <div className="truncate text-body-sm text-on-surface-variant">{a.desc}</div>
          </div>
          <Icon
            name="arrow_forward"
            className="ml-auto hidden shrink-0 text-on-surface-variant opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 sm:block"
          />
        </Link>
      ))}
    </div>
  );
}
