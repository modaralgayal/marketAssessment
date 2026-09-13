import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

/* ── Section card ─────────────────────────────────────────────── */
export function Section({
  num,
  title,
  sub,
  children,
}: {
  num: number;
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-brand-line bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-brand-line pb-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal text-sm font-bold text-white">
          {num}
        </div>
        <div className="text-base font-bold text-brand-ink">{title}</div>
        {sub && <div className="ml-auto text-xs italic text-brand-muted">{sub}</div>}
      </div>
      {children}
    </section>
  );
}

/* ── Label + note wrapper ─────────────────────────────────────── */
export function Field({
  label,
  note,
  error,
  required,
  children,
}: {
  label: string;
  note?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-ink">
        {label}
        {required && <span className="ml-0.5 text-brand-teal">*</span>}
      </span>
      {note && <span className="mb-1.5 block text-[11.5px] italic text-brand-muted">{note}</span>}
      {children}
      {error && (
        <span data-error="true" className="mt-1 block text-[11.5px] font-medium text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}

/* ── Text input ───────────────────────────────────────────────── */
export function TextInput<T extends FieldValues>({
  name,
  register,
  placeholder,
  type = "text",
}: {
  name: Path<T>;
  register: UseFormRegister<T>;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      {...register(name)}
      className="block w-full rounded border border-brand-line bg-white px-3 py-2 text-[13px] text-brand-ink outline-none focus:border-brand-teal"
    />
  );
}

/* ── Textarea ─────────────────────────────────────────────────── */
export function TextArea<T extends FieldValues>({
  name,
  register,
  placeholder,
  rows = 3,
}: {
  name: Path<T>;
  register: UseFormRegister<T>;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      {...register(name)}
      className="block w-full resize-y rounded border border-brand-line bg-brand-bg-alt p-2.5 text-[13px] text-brand-ink outline-none focus:border-brand-teal"
    />
  );
}

type Option = { value: string | boolean; label: string };

/* ── Single-select dropdown ───────────────────────────────────── */
export function SelectField<T extends FieldValues>({
  name,
  control,
  options,
  placeholder = "Select…",
  searchable = false,
}: {
  name: Path<T>;
  control: Control<T>;
  options: ReadonlyArray<Option>;
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected = options.find((o) => o.value === field.value);
        const hasValue = field.value !== undefined && field.value !== null && field.value !== "";
        return (
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => {
                setOpen((v) => !v);
                setQ("");
              }}
              className={`flex w-full items-center justify-between rounded border border-brand-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-teal ${
                hasValue ? "text-brand-ink" : "text-brand-muted"
              }`}
            >
              <span className="truncate">{selected ? selected.label : placeholder}</span>
              <span className="ml-2 flex-shrink-0 text-brand-muted">▾</span>
            </button>
            {open && (
              <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded border border-brand-line bg-white py-1 shadow-lg">
                {searchable && (
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Type to filter…"
                    className="mb-1 w-full border-b border-brand-line bg-white px-3 py-2 text-[13px] text-brand-ink outline-none"
                  />
                )}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-brand-muted">No matches</div>
                )}
                {filtered.map((o) => (
                  <button
                    type="button"
                    key={String(o.value)}
                    onClick={() => {
                      field.onChange(o.value);
                      setOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-[13px] ${
                      field.value === o.value
                        ? "bg-brand-teal/10 font-medium text-brand-teal"
                        : "text-brand-ink hover:bg-brand-bg-alt"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}

/* ── Multi-select dropdown (checkbox popover) ─────────────────── */
export function MultiSelectDropdown<T extends FieldValues>({
  name,
  control,
  options,
  placeholder = "Select…",
  maxLabels = 3,
}: {
  name: Path<T>;
  control: Control<T>;
  options: ReadonlyArray<Option>;
  placeholder?: string;
  maxLabels?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value) ? field.value : [];
        const toggle = (value: string) =>
          field.onChange(
            selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
          );
        const labels = options
          .filter((o) => selected.includes(String(o.value)))
          .map((o) => o.label);
        const summary =
          labels.length === 0
            ? placeholder
            : labels.length <= maxLabels
              ? labels.join(", ")
              : `${labels.slice(0, maxLabels).join(", ")} +${labels.length - maxLabels} more`;
        return (
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded border border-brand-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-teal ${
                selected.length ? "text-brand-ink" : "text-brand-muted"
              }`}
            >
              <span className="truncate">{summary}</span>
              <span className="ml-2 flex-shrink-0 text-brand-muted">▾</span>
            </button>
            {open && (
              <div className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded border border-brand-line bg-white py-1 shadow-lg">
                {options.map((o) => (
                  <label
                    key={String(o.value)}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] text-brand-ink hover:bg-brand-bg-alt"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(String(o.value))}
                      onChange={() => toggle(String(o.value))}
                      className="h-4 w-4 flex-shrink-0 accent-brand-teal"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
