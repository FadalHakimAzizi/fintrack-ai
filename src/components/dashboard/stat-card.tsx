import { Icon } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: string;
  tone?: "primary" | "secondary" | "tertiary" | "error";
  /**
   * Month-over-month change. `direction` drives the arrow; `good` drives the
   * color — so "expenses down" can show a down-arrow that's still green.
   */
  trend?: { value: string; direction: "up" | "down"; good: boolean };
  /** Optional 6-month series rendered as a mini trend line at the card's base. */
  spark?: { values: number[]; color: string };
  /**
   * Replaces the "vs bulan lalu" footnote. With a `trend`, it labels the pill;
   * without one, it shows on its own (e.g. a period like "12 bulan terakhir")
   * instead of the dashboard's "Baru" fallback.
   */
  caption?: string;
}

// Each tone drives the gradient surface tint, the icon chip, and the accent bar.
const tones = {
  primary: {
    chip: "bg-gradient-to-br from-primary to-on-primary-fixed-variant text-on-primary",
    surface: "from-primary/[0.07]",
    accent: "bg-primary",
  },
  secondary: {
    chip: "bg-gradient-to-br from-secondary to-secondary/70 text-on-secondary",
    surface: "from-secondary/[0.08]",
    accent: "bg-secondary",
  },
  tertiary: {
    chip: "bg-gradient-to-br from-tertiary to-tertiary/70 text-on-tertiary",
    surface: "from-tertiary/[0.08]",
    accent: "bg-tertiary",
  },
  error: {
    chip: "bg-gradient-to-br from-error to-error/70 text-on-error",
    surface: "from-error/[0.08]",
    accent: "bg-error",
  },
} as const;

export function StatCard({ label, value, icon, tone = "primary", trend, spark, caption }: Props) {
  const t = tones[tone];
  return (
    <div className="card-interactive group relative overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-card">
      {/* Soft tone-tinted gradient wash across the whole surface */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-80",
          t.surface,
        )}
      />
      {/* Top accent bar — brightens on hover */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity group-hover:opacity-100",
          t.accent,
        )}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-label-caps uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl shadow-sm ring-1 ring-inset ring-white/15 transition-transform duration-200 group-hover:scale-105",
            t.chip,
          )}
        >
          <Icon name={icon} filled />
        </div>
      </div>

      <div className="relative mt-5 text-h1 font-h1 tabular text-on-surface">{value}</div>

      <div className="relative mt-3 flex items-center gap-2">
        {trend ? (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-body-sm font-semibold",
                trend.good ? "bg-secondary/12 text-secondary" : "bg-error/12 text-error",
              )}
            >
              <Icon name={trend.direction === "up" ? "arrow_upward" : "arrow_downward"} />
              {trend.value}
            </span>
            <span className="text-body-sm text-on-surface-variant">{caption ?? "vs bulan lalu"}</span>
          </>
        ) : caption ? (
          <span className="text-body-sm text-on-surface-variant">{caption}</span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1 text-body-sm font-medium text-on-surface-variant">
              <Icon name="remove" />
              Baru
            </span>
            <span className="text-body-sm text-on-surface-variant">vs bulan lalu</span>
          </>
        )}
      </div>

      {spark ? (
        <div className="relative mt-4 -mb-1">
          <Sparkline values={spark.values} color={spark.color} />
        </div>
      ) : null}
    </div>
  );
}
