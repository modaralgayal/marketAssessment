import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const MAX_W = "max-w-[1160px]";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto ${MAX_W} px-8 ${className}`}>{children}</div>;
}

type ButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: "primary" | "outline";
  className?: string;
};

export function Button({
  children,
  to,
  href,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 focus-visible:ring-offset-2 active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-brand-teal text-white shadow-sm hover:bg-brand-teal-dark hover:shadow-md hover:-translate-y-px"
      : "border border-brand-line bg-white text-brand-ink hover:border-brand-teal hover:text-brand-teal hover:bg-brand-teal/[0.03]";
  const cls = `${base} ${styles} ${className}`;
  if (to) return <Link to={to} className={cls}>{children}</Link>;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button className={cls}>{children}</button>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 text-xs font-extrabold uppercase tracking-[1.5px] text-brand-teal">
      {children}
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mb-12 max-w-[720px]">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-[34px] font-bold leading-[1.1] text-brand-ink md:text-[40px]">{title}</h2>
      {sub && <p className="mt-3 text-base text-brand-muted">{sub}</p>}
    </div>
  );
}
