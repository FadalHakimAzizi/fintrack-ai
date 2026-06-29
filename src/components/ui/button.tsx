import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-xs hover:bg-on-primary-fixed-variant hover:shadow-card hover:-translate-y-px disabled:opacity-60",
  secondary:
    "bg-secondary text-on-secondary shadow-xs hover:bg-on-secondary-fixed-variant hover:shadow-card hover:-translate-y-px disabled:opacity-60",
  ghost:
    "bg-surface-container-low border border-outline/30 text-on-surface hover:bg-surface-container hover:border-outline/60",
  danger: "bg-error text-on-error shadow-xs hover:opacity-90 hover:shadow-card disabled:opacity-60",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-body-sm",
  md: "px-6 py-3 text-body-md",
  lg: "px-8 py-3 text-body-md",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition-[transform,box-shadow,background-color,opacity] duration-200 ease-out",
        "active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
