import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { submitExportLead, type TargetMarket } from "../../lib/api";
import { COUNTRIES } from "./countries";

type ExportLeadCtx = { open: () => void };
const Ctx = createContext<ExportLeadCtx>({ open: () => {} });

/** Open the "Start Exporting" intake modal from anywhere (nav, hero, programs). */
export function useExportLead() {
  return useContext(Ctx);
}

type FormState = {
  companyName: string;
  country: string;
  fullName: string;
  workEmail: string;
  website: string;
  product: string;
  targetMarket: TargetMarket | "";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY: FormState = {
  companyName: "",
  country: "",
  fullName: "",
  workEmail: "",
  website: "",
  product: "",
  targetMarket: "",
};

const MARKETS: { value: TargetMarket; label: string }[] = [
  { value: "SAUDI_ARABIA", label: "Saudi Arabia" },
  { value: "UAE", label: "UAE" },
  { value: "BOTH", label: "Both markets" },
];

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-brand-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-brand-line bg-white px-3.5 py-2.5 text-[14px] text-brand-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20";

export function ExportLeadProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setForm(EMPTY);
    setErrors({});
    setError(null);
    setDone(false);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.companyName.trim()) next.companyName = "Enter your company name.";
    if (!form.country) next.country = "Select your country.";
    if (!form.fullName.trim()) next.fullName = "Enter your full name.";
    if (!EMAIL_RE.test(form.workEmail)) next.workEmail = "Enter a valid work email.";
    if (!form.product.trim()) next.product = "Tell us what you'd like to export.";
    if (!form.targetMarket) next.targetMarket = "Choose a target market.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitExportLead({
        companyName: form.companyName.trim(),
        country: form.country,
        fullName: form.fullName.trim(),
        workEmail: form.workEmail.trim(),
        website: form.website.trim() || undefined,
        product: form.product.trim(),
        targetMarket: form.targetMarket as TargetMarket,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-brand-ink/60 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Start exporting"
        >
          <div className="relative my-6 w-full max-w-[620px] rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-bg-alt hover:text-brand-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {done ? (
              <div className="px-8 py-14 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10 text-xl text-brand-teal">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-brand-ink">Thanks — we're on it</h2>
                <p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-relaxed text-brand-muted">
                  We've received your details. Our in-market expert will review your website and send
                  you our Opportunity Assessment Form (OAF) along with your Assessment Report.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-6 inline-block rounded-full bg-brand-teal px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-teal-dark"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="px-8 py-9">
                <p className="text-[12px] font-bold uppercase tracking-[1.5px] text-brand-teal">
                  Start exporting
                </p>
                <h2 className="mt-2 text-[26px] font-bold leading-tight text-brand-ink">
                  Let's see how we can sell your products
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-brand-muted">
                  Just tell us about your company and products. We will review your website and send
                  you our Opportunity Assessment Form.
                </p>
                <ul className="mt-4 space-y-1.5 rounded-xl bg-brand-bg-alt p-4 text-[13px] text-brand-ink">
                  <li className="flex gap-2">
                    <span className="text-brand-teal">•</span>
                    Our In-Market Expert will review your website
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-teal">•</span>
                    We will send you our comprehensive Opportunity Assessment Form (OAF)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-teal">•</span>
                    We will send you our Assessment Report — an overview of your products' fit based on
                    regulatory requirements, market size, availability of relevant buyers
                    (distributors and retailers), and product-market fit.
                  </li>
                </ul>

                <div className="mt-6 space-y-4">
                  <Field label="Company name" error={errors.companyName}>
                    <input
                      className={inputCls}
                      value={form.companyName}
                      onChange={(e) => set("companyName", e.target.value)}
                      placeholder="e.g. Nordic Dairy Co."
                    />
                  </Field>

                  <Field label="Country" error={errors.country}>
                    <select
                      className={inputCls}
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                    >
                      <option value="">Select your country…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={errors.fullName}>
                      <input
                        className={inputCls}
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                        placeholder="Jane Doe"
                      />
                    </Field>
                    <Field label="Work email" error={errors.workEmail}>
                      <input
                        type="email"
                        className={inputCls}
                        value={form.workEmail}
                        onChange={(e) => set("workEmail", e.target.value)}
                        placeholder="jane@company.com"
                      />
                    </Field>
                  </div>

                  <Field label="Website" error={errors.website}>
                    <input
                      className={inputCls}
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://company.com"
                    />
                  </Field>

                  <Field label="Product to export" error={errors.product}>
                    <input
                      className={inputCls}
                      value={form.product}
                      onChange={(e) => set("product", e.target.value)}
                      placeholder="e.g. Organic oat milk"
                    />
                  </Field>

                  <Field label="Target export market" error={errors.targetMarket}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      {MARKETS.map((m) => (
                        <label
                          key={m.value}
                          className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-[14px] transition ${
                            form.targetMarket === m.value
                              ? "border-brand-teal bg-brand-teal/5 font-semibold text-brand-ink"
                              : "border-brand-line text-brand-muted hover:border-brand-teal/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="targetMarket"
                            className="accent-brand-teal"
                            checked={form.targetMarket === m.value}
                            onChange={() => set("targetMarket", m.value)}
                          />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-full bg-brand-teal px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Start exporting"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
