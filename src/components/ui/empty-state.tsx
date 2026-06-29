import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Consistent empty state: icon chip + title + helper text + optional action.
 * Use whenever a list/section has no content yet.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-12 text-center", className)}>
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface-container text-on-surface-variant ring-1 ring-inset ring-outline-variant/30">
        <Icon name={icon} />
      </div>
      <p className="text-body-md font-medium text-on-surface">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-body-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
