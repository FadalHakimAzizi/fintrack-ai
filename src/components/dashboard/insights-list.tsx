import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/insights";

const TONES = {
  info: "bg-primary-container/10 text-primary border-primary/20",
  good: "bg-secondary-container text-on-secondary-container border-secondary/20",
  warn: "bg-tertiary-container/20 text-tertiary border-tertiary/20",
  alert: "bg-error-container text-on-error-container border-error/20",
} as const;

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {insights.map((ins) => (
        <div
          key={ins.id}
          className={cn(
            "p-4 rounded-lg border flex gap-3",
            TONES[ins.tone],
          )}
        >
          <div className="shrink-0 mt-0.5">
            <Icon name={ins.icon} filled />
          </div>
          <div className="min-w-0">
            <div className="text-body-md font-semibold">{ins.title}</div>
            <div className="text-body-sm opacity-80 mt-0.5">{ins.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
