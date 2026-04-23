import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl p-6 shadow-card border border-outline-variant/30",
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
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 pb-4 border-b border-outline-variant/50">
      <div>
        <h3 className="text-h3 font-h3 text-on-surface">{title}</h3>
        {subtitle ? (
          <p className="text-body-sm text-outline mt-1">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
