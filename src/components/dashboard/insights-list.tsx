import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insights";

// Colored icon chip per tone; the card itself stays neutral so the titles read
// at full contrast and the grid feels calmer than fully-tinted boxes.
const CHIPS = {
  info: "bg-primary/12 text-primary",
  good: "bg-secondary/15 text-secondary",
  warn: "bg-tertiary/15 text-tertiary",
  alert: "bg-error/12 text-error",
} as const;

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {insights.map((ins) => (
        <div
          key={ins.id}
          className="group flex gap-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-4 transition-colors duration-200 hover:bg-surface-container-low"
        >
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-black/[0.04] transition-transform duration-200 group-hover:scale-105",
              CHIPS[ins.tone],
            )}
          >
            <Icon name={ins.icon} filled />
          </div>
          <div className="min-w-0">
            <div className="text-body-md font-semibold text-on-surface">{ins.title}</div>
            <div className="mt-0.5 text-body-sm text-on-surface-variant">{ins.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
