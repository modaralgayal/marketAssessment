import type { ReactNode } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";

/* ── Section header ───────────────────────────────────────────── */
export function SectionHeader({ num, title, sub }: { num: number; title: string; sub?: string }) {
  return (
    <div className="mt-11 flex items-center gap-3.5 border-b-2 border-mid-blue pb-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-mid-blue text-sm font-bold text-white">
        {num}
      </div>
      <div className="text-base font-bold text-dark-blue">{title}</div>
      {sub && <div className="ml-auto text-xs italic text-gray-400">{sub}</div>}
    </div>
  );
}

/* ── Label + note wrapper ─────────────────────────────────────── */
export function Field({
  label,
  note,
  error,
  children,
}: {
  label: string;
  note?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-[18px]">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dark-blue">
        {label}
      </span>
      {note && <span className="mb-1.5 block text-[11.5px] italic text-gray-400">{note}</span>}
      {children}
      {error && <span className="mt-1 block text-[11.5px] text-red-600">{error}</span>}
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
      className="block w-full border-0 border-b-[1.5px] border-border bg-transparent py-1.5 text-[13px] text-[#333] outline-none focus:border-mid-blue"
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
      className="block w-full resize-y rounded border border-border bg-light-gray p-2.5 text-[13px] text-[#333] outline-none focus:border-mid-blue"
    />
  );
}

/* ── Chip used by radio / checkbox groups ─────────────────────── */
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-xs transition ${
        selected
          ? "border-mid-blue bg-mid-blue text-white"
          : "border-border text-[#333] hover:border-mid-blue hover:text-mid-blue"
      }`}
    >
      {children}
    </button>
  );
}

type Option = { value: string; label: string };

/* ── Single-select chip group (enum) ──────────────────────────── */
export function RadioChips<T extends FieldValues>({
  name,
  control,
  options,
}: {
  name: Path<T>;
  control: Control<T>;
  options: ReadonlyArray<Option>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((o) => (
            <Chip
              key={o.value}
              selected={field.value === o.value}
              onClick={() => field.onChange(field.value === o.value ? undefined : o.value)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      )}
    />
  );
}

/* ── Multi-select chip group (array) ──────────────────────────── */
export function CheckboxChips<T extends FieldValues>({
  name,
  control,
  options,
}: {
  name: Path<T>;
  control: Control<T>;
  options: ReadonlyArray<Option>;
}) {
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
        return (
          <div className="mt-1 flex flex-wrap gap-2">
            {options.map((o) => (
              <Chip key={o.value} selected={selected.includes(o.value)} onClick={() => toggle(o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        );
      }}
    />
  );
}

/* ── Yes / No chip group (boolean) ────────────────────────────── */
export function YesNoChips<T extends FieldValues>({
  name,
  control,
}: {
  name: Path<T>;
  control: Control<T>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="mt-1 flex gap-3">
          {[
            { v: true, l: "Yes" },
            { v: false, l: "No" },
          ].map((o) => (
            <Chip
              key={o.l}
              selected={field.value === o.v}
              onClick={() => field.onChange(field.value === o.v ? undefined : o.v)}
            >
              {o.l}
            </Chip>
          ))}
        </div>
      )}
    />
  );
}
