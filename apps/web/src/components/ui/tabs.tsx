import { cn } from "@/lib/utils";

export interface SegmentedTabsItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  items,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  items: SegmentedTabsItem<T>[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap gap-2", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onValueChange(it.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-brand-teal text-white shadow-sm"
                : "border border-brand-line bg-white text-brand-muted hover:border-brand-teal hover:text-brand-teal",
            )}
          >
            {it.label}
            {typeof it.count === "number" && <span className="opacity-70"> ({it.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
