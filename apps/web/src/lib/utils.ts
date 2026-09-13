export type ClassValue = string | number | false | null | undefined;

/** Minimal class-name joiner (shadcn-style, dependency-free). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
