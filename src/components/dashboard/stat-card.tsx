import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: string;
  tone?: "primary" | "secondary" | "tertiary" | "error";
  trend?: { value: string; positive: boolean };
}

const tones = {
  primary: "bg-primary-container/10 text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container/10 text-tertiary",
  error: "bg-error-container text-on-error-container",
} as const;

export function StatCard({ label, value, icon, tone = "primary", trend }: Props) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <span className="text-label-caps text-outline uppercase tracking-wider">
          {label}
        </span>
        <div className={cn("w-10 h-10 rounded-full grid place-items-center", tones[tone])}>
          <Icon name={icon} filled />
        </div>
      </div>
      <div className="text-h1 font-h1 text-on-surface tabular">{value}</div>
      {trend ? (
        <div
          className={cn(
            "mt-2 text-body-sm inline-flex items-center gap-1",
            trend.positive ? "text-secondary" : "text-error",
          )}
        >
          <Icon name={trend.positive ? "trending_up" : "trending_down"} />
          {trend.value}
        </div>
      ) : null}
    </div>
  );
}
