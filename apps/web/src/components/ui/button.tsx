import * as React from "react";
import { cn, type ClassValue } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "secondary" | "destructive";
type Size = "sm" | "default" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<Variant, string> = {
  default: "bg-brand-teal text-white shadow-sm hover:bg-brand-teal-dark",
  outline:
    "border border-brand-line bg-white text-brand-ink hover:border-brand-teal hover:text-brand-teal",
  ghost: "text-brand-ink hover:bg-brand-bg-alt",
  secondary: "bg-brand-bg-alt text-brand-ink hover:bg-brand-line",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  default: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
};

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: ClassValue;
} = {}): string {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(base, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
