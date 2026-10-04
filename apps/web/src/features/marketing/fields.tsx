import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { countryOptions, COUNTRIES, EXPORT_CODES } from "./content";

export function InputField({
  name,
  label,
  type = "text",
  required = true,
  placeholder = "",
  value,
  onChange,
  optional,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? " *" : ""}
        {optional ? <small> (optional)</small> : null}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </label>
  );
}

export function TextAreaField({
  name,
  label,
  required = true,
  placeholder = "",
  rows = 4,
  value,
  onChange,
  optional,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <label className={`form-field${required ? "" : " full"}`}>
      <span>
        {label}
        {required ? " *" : ""}
        {optional ? <small> (optional)</small> : null}
      </span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function CountrySelect({
  name,
  label,
  required = true,
  exportOnly = false,
  value,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  exportOnly?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const opts = useMemo(() => countryOptions(exportOnly), [exportOnly]);
  return (
    <label className="form-field full">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <select name={name} required={required} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{exportOnly ? "Select a market" : "Select a country / territory"}</option>
        {opts.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Searchable multi-country dropdown (targetMarket / sourceCountries).
 *
 * Selected countries render as removable chips inside the control. Clicking the
 * control opens a panel with a text search that filters the country list; the
 * user toggles countries on/off from the filtered list. Closes on outside click.
 */
export function CountryMultiSelect({
  name,
  label,
  required = true,
  exportOnly = false,
  value,
  onChange,
}: {
  name: string;
  label: string;
  required?: boolean;
  exportOnly?: boolean;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const opts = useMemo(() => countryOptions(exportOnly), [exportOnly]);
  const q = query.trim().toLowerCase();
  const visible = q ? opts.filter((c) => c.label.toLowerCase().includes(q)) : opts;
  const selected = value
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean) as { code: string; label: string }[];

  // Close the dropdown when clicking outside the component.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((v) => v !== code) : [...value, code]);
  }

  return (
    <div className="form-field full country-multiselect" id={name} ref={containerRef}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <div
        className="cms-control"
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        {selected.length === 0 ? (
          <span className="cms-placeholder">Select countries…</span>
        ) : (
          <div className="chip-row">
            {selected.map((c) => (
              <span key={c.code} className="country-chip">
                {c.label}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${c.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(c.code);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <span className="cms-caret" aria-hidden="true">
          ▾
        </span>
      </div>
      {open && (
        <div className="cms-dropdown">
          <input
            type="search"
            className="country-search"
            autoFocus
            placeholder="Search countries"
            aria-label={`Search ${label}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
          />
          <ul className="cms-options" role="listbox" aria-multiselectable="true">
            {visible.map((c) => {
              const isSel = value.includes(c.code);
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={`cms-option${isSel ? " selected" : ""}`}
                    onClick={() => toggle(c.code)}
                  >
                    <span className="cms-check" aria-hidden="true">
                      {isSel ? "✓" : ""}
                    </span>
                    {c.label}
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="country-empty">No countries match “{query}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function FileField({
  name,
  label,
  accept,
  hint,
  required = false,
  onChange,
  optional,
}: {
  name: string;
  label: string;
  accept: string;
  hint?: string;
  required?: boolean;
  onChange: (file: File | null) => void;
  optional?: boolean;
}) {
  return (
    <label className="form-field full">
      <span>
        {label}
        {required ? " *" : ""}
        {optional ? <small> (optional)</small> : null}
      </span>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function ConsentNote() {
  return (
    <p className="form-consent">
      By submitting, you agree that Tradelomacy may contact you about this request. See our{" "}
      <a href="/privacy">Privacy Policy</a>.
    </p>
  );
}

export function ReviewNote() {
  return (
    <p className="prototype-note">
      Your details are sent securely to our team. We’ll be in touch within two business days.
    </p>
  );
}

export function FormFeedback({ status, message }: { status: "idle" | "ok" | "error"; message: string }) {
  if (status === "idle" || !message) return null;
  return (
    <p className="form-feedback" role="status" style={status === "ok" ? undefined : { borderColor: "#c0392b", color: "#c0392b" }}>
      {message}
    </p>
  );
}

// Re-export for convenience
export { EXPORT_CODES };
