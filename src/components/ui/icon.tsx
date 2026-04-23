import { cn } from "@/lib/utils";

export function Icon({
  name,
  filled = false,
  className,
}: {
  name: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
      aria-hidden
    >
      {name}
    </span>
  );
}
