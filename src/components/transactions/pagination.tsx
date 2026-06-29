import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  /** Current filters (without `page`); used to preserve them across pages. */
  params: Record<string, string>;
}

export function Pagination({ page, totalPages, params }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };

  const items = pageItems(page, totalPages);

  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-5 flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-4"
    >
      <PageLink
        href={href(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="gap-1 px-3"
      >
        <Icon name="chevron_left" />
        <span className="hidden sm:inline">Sebelumnya</span>
      </PageLink>

      <div className="flex items-center gap-1">
        {items.map((it, i) =>
          it === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-on-surface-variant">
              …
            </span>
          ) : (
            <PageLink key={it} href={href(it)} active={it === page} aria-label={`Halaman ${it}`}>
              {it}
            </PageLink>
          ),
        )}
      </div>

      <PageLink
        href={href(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="gap-1 px-3"
      >
        <span className="hidden sm:inline">Berikutnya</span>
        <Icon name="chevron_right" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  className,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.AriaAttributes) {
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-body-sm font-medium transition-colors";
  if (disabled) {
    return (
      <span
        aria-disabled
        className={cn(base, "cursor-not-allowed text-outline/50", className)}
        {...rest}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        active
          ? "bg-primary text-on-primary shadow-xs"
          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

// First, last, current ±1 — collapse the rest into ellipses.
function pageItems(page: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - 1 && i <= page + 1)) {
      out.push(i);
    } else if (out[out.length - 1] !== "…") {
      out.push("…");
    }
  }
  return out;
}
