import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function Card({
  children,
  className,
  interactive = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds a subtle hover-lift + deeper shadow for clickable cards. */
  interactive?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30",
        interactive && "card-interactive cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  iconTone = "primary",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Optional leading icon chip. */
  icon?: string;
  iconTone?: "primary" | "secondary" | "tertiary" | "error";
}) {
  const tone = {
    primary: "bg-primary/12 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    tertiary: "bg-tertiary/15 text-tertiary",
    error: "bg-error/12 text-error",
  }[iconTone];

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone)}>
            <Icon name={icon} filled />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-h3 font-h2 tracking-tight text-on-surface">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}
