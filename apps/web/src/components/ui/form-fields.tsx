// Shared form-field primitives, used by both the manufacturer and buyer profile
// forms (and any future profile-style form). These were previously duplicated in
// each form file; the manufacturer definitions are the canonical ones because
// they are a strict superset of the buyer's (they forward `required`/`error`/`id`
// and render a styled required marker), so every call site in both forms is covered.
//
// If you add a new shared field primitive, keep it dependency-free: it should only
// depend on these UI atoms and `react`.
import { type ReactNode } from "react";
import { Label } from "./label";
import { Input } from "./input";

export function Field({
  label,
  required,
  error,
  id,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5" id={id} data-field-error={error ? "" : undefined}>
      <Label>
        {label}
        {required && <span className="text-brand-teal"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
}) {
  return (
    <Field label={label} required={required} error={error} id={id}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "border-red-500 focus:border-red-500" : undefined}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
  error,
  id,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  id?: string;
}) {
  return (
    <Field label={label} required={required} error={error} id={id}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-line px-2.5 py-1.5 text-xs text-brand-ink"
          >
            <input
              type="checkbox"
              checked={value.includes(o.value)}
              onChange={() => toggle(o.value)}
              className="accent-brand-teal"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-brand-teal"> *</span>}
      </Label>
      <div className="space-y-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onChange(o.value)}
              aria-pressed={selected}
              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                selected
                  ? "border-brand-teal bg-brand-teal/10 text-brand-ink"
                  : "border-brand-line text-brand-ink hover:bg-brand-bg-alt"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-brand-teal" : "border-brand-line"
                }`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-brand-teal" />}
              </span>
              <span className="leading-snug">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Panel({
  n,
  title,
  subtitle,
  id,
  children,
}: {
  n: string;
  title: string;
  subtitle?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 rounded-2xl border border-brand-line bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-bg-alt text-xs font-bold text-brand-teal">
          {n}
        </span>
        <div>
          <h2 className="text-base font-semibold text-brand-ink">{title}</h2>
          {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
