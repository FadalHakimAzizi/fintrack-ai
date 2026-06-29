import { cn } from "@/lib/utils";

/** Shimmer placeholder for content that is still loading (>1s operations). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-surface-container-high/70",
        className,
      )}
    />
  );
}

/** A few stacked lines — handy for list/row loading states. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}
