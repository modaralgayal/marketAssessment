import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "muted" | "amber";

const variantClasses: Record<Variant, string> = {
  default: "bg-brand-teal/15 text-brand-teal-dark",
  secondary: "bg-brand-bg-alt text-brand-ink",
  outline: "border border-brand-line text-brand-muted",
  muted: "bg-brand-muted/15 text-brand-muted",
  amber: "bg-amber-100 text-amber-800",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
