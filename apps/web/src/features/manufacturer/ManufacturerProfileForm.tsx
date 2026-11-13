import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  fetchManufacturerProfile,
  upsertManufacturerProfile,
  uploadManufacturerCatalogue,
  addManufacturerCatalogueLink,
  fetchManufacturerCatalogueFileUrl,
  deleteManufacturerCatalogueFile,
  uploadManufacturerLogo,
  deleteManufacturerLogo,
  ApiError,
  type ManufacturerProfileInput,
  type ManufacturerFileInfo,
} from "../../lib/api";
import { COUNTRIES } from "../../lib/countries";

function Field({
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

function TextField({
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

function SelectField({
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

function CheckboxGroup({
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

function RadioGroup({
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

const COVERAGE_ITEMS: { key: string; label: string }[] = [
  { key: "pictures", label: "Product pictures" },
  { key: "logistics", label: "Logistical information / pallet loading" },
  { key: "usp", label: "Unique selling point" },
  { key: "shelfLife", label: "Product shelf life" },
];

function CatalogueCoverage({
  value,
  onChange,
}: {
  value: Record<string, boolean> | undefined;
  onChange: (v: Record<string, boolean>) => void;
}) {
  const current = value ?? {};
  const setItem = (key: string, val: boolean) => onChange({ ...current, [key]: val });
  return (
    <div className="space-y-1.5">
      <Label>Does your catalogue clearly show the following? <span className="text-brand-teal">*</span></Label>
      <div className="divide-y divide-brand-line rounded-lg border border-brand-line">
        {COVERAGE_ITEMS.map((item) => {
          const state = current[item.key];
          return (
            <div key={item.key} className="flex items-center justify-between px-3 py-2 text-sm text-brand-ink">
              <span>{item.label}</span>
              <div className="flex gap-1">
                {["Yes", "No"].map((opt) => {
                  const val = opt === "Yes";
                  const active = state === val;
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setItem(item.key, val)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "bg-brand-teal text-white"
                          : "border border-brand-line text-brand-muted hover:bg-brand-bg-alt"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatalogueUpload({ files }: { files: ManufacturerFileInfo[] }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });

  const upload = useMutation({
    mutationFn: (f: File) => uploadManufacturerCatalogue(f),
    onSuccess: () => {
      setErr(null);
      refresh();
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Upload failed."),
  });
  const addLink = useMutation({
    mutationFn: () => addManufacturerCatalogueLink(linkUrl.trim()),
    onSuccess: () => {
      setErr(null);
      setLinkUrl("");
      refresh();
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Could not add link."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteManufacturerCatalogueFile(id),
    onSuccess: () => {
      setErr(null);
      refresh();
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Remove failed."),
  });

  const open = async (f: ManufacturerFileInfo) => {
    if (f.kind === "link" && f.url) {
      window.open(f.url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const { url } = await fetchManufacturerCatalogueFileUrl(f.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Dashed upload zone — mirrors the manufacturer dashboard prototype. */}
      <div className="rounded-xl border-2 border-dashed border-brand-line bg-brand-bg-alt/40 px-4 py-6 text-center">
        <p className="text-sm font-medium text-brand-ink">Attach your catalogue or price list</p>
        <p className="mt-1 text-xs text-brand-muted">Keep product information in your documents.</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <label className="cursor-pointer rounded-lg bg-brand-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-teal-dark">
            {uploading ? "Uploading…" : "↑ Attach a PDF"}
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUploading(true);
                  try {
                    await upload.mutateAsync(f);
                  } finally {
                    setUploading(false);
                  }
                }
                e.target.value = "";
              }}
            />
          </label>
          <div className="flex items-center gap-1">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://… catalogue or price list"
              className="h-9 w-64 rounded-lg border border-brand-line bg-white px-2 text-sm text-brand-ink outline-none focus:border-brand-teal"
            />
            <Button size="sm" variant="outline" disabled={!linkUrl.trim() || addLink.isPending} onClick={() => addLink.mutate()}>
              Add link
            </Button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-brand-muted">PDF files, up to 15 MB each · You can also add a link below.</p>
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-brand-line rounded-lg border border-brand-line">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate text-brand-ink">{f.originalName}</p>
                <p className="text-[11px] uppercase tracking-wide text-brand-muted">
                  {f.kind === "link" ? "Catalogue link" : "PDF attachment"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="text-xs font-medium text-brand-teal hover:underline" onClick={() => open(f)}>
                  {f.kind === "link" ? "Open link" : "View PDF"}
                </button>
                <button
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(f.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

// Reference-prototype option sets (mirror the manufacturer dashboard spec exactly).
// These are intentionally local so the public assessment form's shared option sets stay untouched.
const REVENUE_PROFILE_OPTIONS = [
  { value: "UNDER_1M", label: "Under $1 million" },
  { value: "1_5M", label: "$1M – $5M" },
  { value: "5_10M", label: "$5M – $10M" },
  { value: "10_50M", label: "$10M – $50M" },
  { value: "50_100M", label: "$50M – $100M" },
  { value: "OVER_100M", label: "Over $100 million" },
  { value: "PREFER_NOT", label: "Prefer not to disclose" },
];

const FROZEN_STORAGE_PROFILE_OPTIONS = [
  { value: "ALL", label: "Yes, all products" },
  { value: "SOME", label: "Yes, only some products" },
  { value: "NO", label: "No" },
  { value: "CONFIRM", label: "Confirm from catalogue" },
];

const ADAPTABILITY_PROFILE_OPTIONS = [
  { value: "YES_FULL", label: "Yes – we adapt product specs, labels and packaging" },
  { value: "LABELS_PACKAGING", label: "Labels and packaging only" },
  { value: "CASE_BY_CASE", label: "Discuss it case by case" },
  { value: "NO", label: "No – our product is sold as-is" },
];

const CAPACITY_PROFILE_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "YES_VOLUMES", label: "Yes, subject to volumes" },
  { value: "CASE_BY_CASE", label: "Assess case by case" },
  { value: "NOT_CURRENT", label: "Not currently" },
];

const CERT_PROFILE_OPTIONS = [
  { value: "Halal", label: "Halal" },
  { value: "BRCGS", label: "BRCGS" },
  { value: "IFS", label: "IFS" },
  { value: "FSSC 22000", label: "FSSC 22000" },
  { value: "ISO 22000", label: "ISO 22000" },
  { value: "ISO 9001", label: "ISO 9001" },
  { value: "HACCP", label: "HACCP" },
  { value: "Organic", label: "Organic" },
  { value: "Other", label: "Other" },
  { value: "None currently", label: "None currently" },
];

const BRANDING_PROFILE_OPTIONS = [
  { value: "brandLed", label: "Brand-led approach. We invest in marketing and promoting our brand." },
  { value: "shared", label: "Shared investment approach. We invest in marketing and promotion if our partner commits to investing with us." },
  { value: "tradeSupport", label: "Marketing support approach. We provide limited marketing support to our partners." },
  { value: "priceLed", label: "Price-led approach. We provide the best price possible, and the client/partner handles marketing and promotion." },
  { value: "irrelevant", label: "This is irrelevant to our case." },
];

const PRIVATE_LABEL_PROFILE_OPTIONS = [
  { value: "yesAll", label: "Yes. We can produce all our products as private label." },
  { value: "yesSpecific", label: "Yes. Only specific products can be produced as private label." },
  { value: "noBranded", label: "No. We sell only branded products." },
  { value: "noOpen", label: "No. But we are open to discuss it for certain clients/partners." },
];

const SALES_CHANNEL_PROFILE_OPTIONS = [
  { value: "MODERN_RETAIL", label: "Modern retail / supermarkets" },
  { value: "TRADITIONAL_RETAIL", label: "Traditional retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "HORECA", label: "HoReCa / foodservice" },
  { value: "ECOMMERCE", label: "E-commerce" },
  { value: "INDUSTRIAL", label: "Industrial / ingredients" },
];

// All countries / territories (worldwide list) — replaces the old GCC-only set.
const TARGET_EXPORT_MARKET_OPTIONS = COUNTRIES.map((c) => ({ value: c, label: c }));

function Panel({
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

// ── Read-only (columnar) view helpers ────────────────────────────────────────

function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  v?: string | null,
): string | undefined {
  if (!v) return undefined;
  return options.find((o) => o.value === v)?.label ?? v;
}

function ReadRow({
  label,
  value,
  full,
}: {
  label: string;
  value?: string | string[] | null;
  full?: boolean;
}) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  const text = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-brand-ink">{text}</dd>
    </div>
  );
}

function ProfileReadView({
  data,
  logoUrl,
  onEdit,
}: {
  data: ManufacturerProfileInput;
  logoUrl?: string | null;
  onEdit: () => void;
}) {
  const coverage = data.catalogueCoverage;
  const salesChannels = (data.salesChannels ?? [])
    .map((v) => labelFor(SALES_CHANNEL_PROFILE_OPTIONS, v) ?? v)
    .join(", ");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit profile
        </Button>
      </div>

      <Panel n="01" title="Company profile" subtitle="Basic information about your business.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadRow label="Company name" value={data.companyName} />
          <ReadRow label="Country" value={data.country} />
          <ReadRow label="Website" value={data.website} />
          <ReadRow label="Industry / product category" value={data.industryCategory} />
          <ReadRow label="Annual revenue" value={labelFor(REVENUE_PROFILE_OPTIONS, data.annualRevenue)} />
          <ReadRow label="Years in business" value={data.yearsInBusiness} />
          <ReadRow
            label="Export markets"
            value={data.exportCount != null ? String(data.exportCount) : undefined}
          />
          <ReadRow label="What is your company known for?" value={data.knownFor} full />
        </dl>
      </Panel>

      <Panel n="02" id="operations" title="Products and operations" subtitle="Your catalogue and how you support a new market.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadRow label="Frozen / chilled storage required?" value={labelFor(FROZEN_STORAGE_PROFILE_OPTIONS, data.frozenStorage)} />
          <ReadRow label="Label languages available" value={data.labelLanguages} />
          <ReadRow label="Valid certifications" value={data.certs?.join(", ")} />
          <ReadRow label="Product adaptability" value={labelFor(ADAPTABILITY_PROFILE_OPTIONS, data.productAdaptability)} />
          <ReadRow label="Branding & promotional approach" value={labelFor(BRANDING_PROFILE_OPTIONS, data.branding)} />
          <ReadRow label="Private label manufacturing" value={labelFor(PRIVATE_LABEL_PROFILE_OPTIONS, data.privateLabel)} />
          <ReadRow label="MOQ" value={data.moq} />
          <ReadRow label="Production capacity for new market" value={labelFor(CAPACITY_PROFILE_OPTIONS, data.productionCapacity)} />
          <ReadRow label="Lead time" value={data.leadTimes} />
          {coverage && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">
                Catalogue clearly shows
              </dt>
              <dd className="mt-0.5 text-sm text-brand-ink">
                {COVERAGE_ITEMS.map(
                  (i) => `${i.label}: ${coverage[i.key] ? "Yes" : "No"}`,
                ).join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </Panel>

      <Panel n="03" title="Target market" subtitle="Your export ambitions and channel priorities.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadRow label="Target export market" value={data.targetExportMarket} />
          <ReadRow label="Sales channels of interest" value={salesChannels || undefined} />
          <ReadRow label="Channel strategy" value={data.channelStrategy} full />
        </dl>
      </Panel>

      <Panel n="04" title="Decision-maker contact" subtitle="Who we'll speak with about the next steps.">
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadRow label="Full name" value={data.contactFullName} />
          <ReadRow label="Title / position" value={data.contactTitle} />
          <ReadRow label="Email address" value={data.contactEmail} />
          <ReadRow label="Phone number" value={data.contactPhone} />
          <ReadRow
            label="Dedicated export contact?"
            value={data.exportContact == null ? undefined : data.exportContact ? "Yes" : "No"}
          />
          <ReadRow label="Anything else" value={data.anythingElse} full />
        </dl>
      </Panel>

      <Panel n="05" title="Public profile" subtitle="What buyers see when your opportunity card is published.">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-line bg-brand-bg-alt">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-brand-muted">No logo</span>
            )}
          </div>
          <p className="text-xs text-brand-muted">Your public logo, shown on your profile and marketplace cards.</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReadRow label="Public description" value={data.publicDescription} full />
        </dl>
      </Panel>
    </div>
  );
}

export default function ManufacturerProfileForm() {
  const location = useLocation();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["manufacturer-profile"],
    queryFn: () => fetchManufacturerProfile(),
    retry: false,
  });

  // When arriving from the opportunity-cards panel, scroll to the operations
  // section (carried via navigation state).
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo === "operations") {
      document.getElementById("operations")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.state]);

  const [form, setForm] = useState<ManufacturerProfileInput>({
    companyName: "",
    country: "",
    website: undefined,
    industryCategory: "",
    annualRevenue: undefined,
    annualRevenueCustom: undefined,
    yearsInBusiness: undefined,
    currentExportMarkets: undefined,
    currentGccMarkets: [],
    halalCert: undefined,
    sfdaStatus: undefined,
    frozenStorage: undefined,
    shelfLife: undefined,
    otherCerts: [],
    otherCertsCustom: undefined,
    labelLanguages: undefined,
    productAdaptability: undefined,
    brandApproach: undefined,
    leadTimes: undefined,
    targetExportMarket: undefined,
    salesChannels: [],
    channelStrategy: undefined,
    moq: undefined,
    exportContact: undefined,
    productionCapacity: undefined,
    contactFullName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: undefined,
    anythingElse: undefined,
    exportContactDetails: undefined,
    contacts: undefined,
    productCategory: undefined,
    exportCount: undefined,
    knownFor: undefined,
    pictures: undefined,
    logistics: undefined,
    usp: undefined,
    branding: undefined,
    privateLabel: undefined,
    certs: [],
    catalogueCoverage: undefined,
    publicDescription: undefined,
  });
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setForm(existing);
      setLogoUrl(existing.logoUrl ?? null);
      setLoaded(true);
    }
  }, [existing, loaded]);

  // A brand-new manufacturer (no profile yet — GET 404) should land straight in edit mode.
  useEffect(() => {
    if (!isLoading && !existing && !editing) setEditing(true);
  }, [isLoading, existing, editing]);

  // After a failed save, scroll to the first highlighted field so the user lands
  // on the earliest missing/invalid input.
  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const el = document.querySelector<HTMLElement>("[data-field-error]");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fieldErrors]);

  const save = useMutation({
    mutationFn: () => upsertManufacturerProfile(form),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
      setForm(data);
      setLogoUrl(data.logoUrl ?? null);
      setEditing(false);
      setSavedMsg(true);
      setError(null);
      setFieldErrors({});
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields) {
        setFieldErrors(e.fields);
        setError(null);
      } else {
        setFieldErrors({});
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    },
  });

  const set = <K extends keyof ManufacturerProfileInput>(key: K, val: ManufacturerProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Profile logo (image) upload + removal.
  const logoUp = useMutation({
    mutationFn: (f: File) => uploadManufacturerLogo(f),
    onSuccess: (dto) => {
      setLogoUrl(dto.logoUrl ?? null);
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to upload logo."),
  });
  const logoDel = useMutation({
    mutationFn: () => deleteManufacturerLogo(),
    onSuccess: () => {
      setLogoUrl(null);
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to remove logo."),
  });

  const handleCancel = () => {
    if (existing) setForm(existing);
    setFieldErrors({});
    setError(null);
    setEditing(false);
  };

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  if (!editing) {
    return <ProfileReadView data={form} logoUrl={logoUrl} onEdit={() => setEditing(true)} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">Editing your company profile.</p>

      <Panel
        n="01"
        title="Company profile"
        subtitle="Basic information about your business. Fields marked * are required."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Company name" required value={form.companyName} onChange={(v) => set("companyName", v)} error={fieldErrors["companyName"]?.[0]} id="field-companyName" />
          <TextField label="Country" required value={form.country} onChange={(v) => set("country", v)} error={fieldErrors["country"]?.[0]} id="field-country" />
          <TextField
            label="Website"
            required
            value={form.website ?? ""}
            onChange={(v) => set("website", v || undefined)}
          />
          <TextField
            label="Industry / product category"
            required
            value={form.industryCategory}
            onChange={(v) => set("industryCategory", v)}
            error={fieldErrors["industryCategory"]?.[0]}
            id="field-industryCategory"
          />
          <SelectField
            label="Annual revenue"
            required
            value={form.annualRevenue}
            onChange={(v) => set("annualRevenue", (v || undefined) as ManufacturerProfileInput["annualRevenue"])}
            options={REVENUE_PROFILE_OPTIONS}
          />
          <TextField
            label="Years in business"
            required
            value={form.yearsInBusiness ?? ""}
            onChange={(v) => set("yearsInBusiness", v || undefined)}
          />
          <TextField
            label="How many export markets do you currently have?"
            required
            value={form.exportCount?.toString() ?? ""}
            onChange={(v) => set("exportCount", v ? Number(v) : undefined)}
            placeholder="Number of export markets"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>What is your company known for?</Label>
            <Textarea
              value={form.knownFor ?? ""}
              onChange={(e) => set("knownFor", e.target.value || undefined)}
              placeholder="For example: No. 2 in our country in our category; production plants in several countries; venture capital funded."
            />
            <p className="text-xs text-brand-muted">
              Share the strengths or achievements that help a potential partner understand your company.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        n="02"
        id="operations"
        title="Products and operations"
        subtitle="Your catalogue introduces your products. Tell us how you support a new market."
      >
        <CatalogueUpload files={existing?.files ?? []} />
        <CatalogueCoverage value={form.catalogueCoverage} onChange={(v) => set("catalogueCoverage", v)} />

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Frozen / chilled storage required?"
            required
            value={form.frozenStorage}
            onChange={(v) => set("frozenStorage", (v || undefined) as ManufacturerProfileInput["frozenStorage"])}
            options={FROZEN_STORAGE_PROFILE_OPTIONS}
          />
          <TextField
            label="Label languages currently available"
            required
            value={form.labelLanguages ?? ""}
            onChange={(v) => set("labelLanguages", v || undefined)}
            placeholder="e.g. English, Arabic, French"
          />
        </div>

        <CheckboxGroup
          label="Valid certifications (select all that apply)"
          value={form.certs}
          onChange={(v) => set("certs", v)}
          options={CERT_PROFILE_OPTIONS}
        />
        {form.certs.includes("Other") && (
          <Field label="Other certifications">
            <Input
              value={form.otherCertsCustom ?? ""}
              onChange={(e) => set("otherCertsCustom", e.target.value || undefined)}
              placeholder="Please list any other certifications"
            />
          </Field>
        )}

        <SelectField
          label="Product adaptability"
          required
          value={form.productAdaptability}
          onChange={(v) =>
            set("productAdaptability", (v || undefined) as ManufacturerProfileInput["productAdaptability"])
          }
          options={ADAPTABILITY_PROFILE_OPTIONS}
        />
        <RadioGroup
          label="Branding & promotional approach"
          required
          value={form.branding}
          onChange={(v) => set("branding", v || undefined)}
          options={BRANDING_PROFILE_OPTIONS}
        />
        <RadioGroup
          label="Do you offer private label manufacturing services?"
          required
          value={form.privateLabel}
          onChange={(v) => set("privateLabel", v || undefined)}
          options={PRIVATE_LABEL_PROFILE_OPTIONS}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="What is your MOQ?"
            required
            value={form.moq ?? ""}
            onChange={(v) => set("moq", v || undefined)}
            placeholder="e.g. 500 cases, one pallet, or varies by product"
          />
          <SelectField
            label="Can you dedicate production capacity to a new export market?"
            required
            value={form.productionCapacity}
            onChange={(v) =>
              set("productionCapacity", (v || undefined) as ManufacturerProfileInput["productionCapacity"])
            }
            options={CAPACITY_PROFILE_OPTIONS}
          />
          <TextField
            label="What is your lead time?"
            required
            value={form.leadTimes ?? ""}
            onChange={(v) => set("leadTimes", v || undefined)}
            placeholder="e.g. 4–6 weeks from confirmed order"
          />
        </div>
      </Panel>

      <Panel
        n="03"
        title="Target market"
        subtitle="Your export ambitions and channel priorities."
      >
        <SelectField
          label="What is your target export market?"
          required
          value={form.targetExportMarket}
          onChange={(v) => set("targetExportMarket", v || undefined)}
          options={TARGET_EXPORT_MARKET_OPTIONS}
        />
        <CheckboxGroup
          label="Sales channels of interest (select all that apply)"
          value={form.salesChannels}
          onChange={(v) => set("salesChannels", v as ManufacturerProfileInput["salesChannels"])}
          options={SALES_CHANNEL_PROFILE_OPTIONS}
        />
        <div className="space-y-1.5">
          <Label>Channel strategy</Label>
          <Textarea
            value={form.channelStrategy ?? ""}
            onChange={(e) => set("channelStrategy", e.target.value || undefined)}
            placeholder="Describe your channel priorities and preferred approach to working with partners."
          />
        </div>
        <p className="rounded-lg border border-brand-line bg-brand-bg-alt px-3 py-2 text-xs text-brand-muted">
          Use an Opportunity Card for a specific country, partner search and set of proposed terms.
          Your company profile stays reusable across opportunities.
        </p>
      </Panel>

      <Panel
        n="04"
        title="Decision-maker contact"
        subtitle="Who we'll speak with about the next steps."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" required value={form.contactFullName} onChange={(v) => set("contactFullName", v)} error={fieldErrors["contactFullName"]?.[0]} id="field-contactFullName" />
          <TextField label="Title / position" required value={form.contactTitle} onChange={(v) => set("contactTitle", v)} error={fieldErrors["contactTitle"]?.[0]} id="field-contactTitle" />
          <TextField label="Email address" required value={form.contactEmail} onChange={(v) => set("contactEmail", v)} error={fieldErrors["contactEmail"]?.[0]} id="field-contactEmail" />
          <TextField
            label="Phone number"
            required
            value={form.contactPhone ?? ""}
            onChange={(v) => set("contactPhone", v || undefined)}
          />
          <SelectField
            label="Do you have a dedicated export contact?"
            required
            value={form.exportContact === true ? "yes" : form.exportContact === false ? "no" : ""}
            onChange={(v) =>
              set(
                "exportContact",
                v === "yes" ? true : v === "no" ? false : undefined,
              )
            }
            options={[
              { value: "yes", label: "Yes, the person listed above" },
              { value: "yesOther", label: "Yes, a different person" },
              { value: "no", label: "No, not currently" },
            ]}
          />
          {form.exportContact === true && (
            <Field label="Export contact details">
              <Textarea
                value={form.exportContactDetails ?? ""}
                onChange={(e) => set("exportContactDetails", e.target.value || undefined)}
                placeholder="Name, email and phone of the dedicated export contact."
              />
            </Field>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Anything else we should know?<span className="text-brand-teal"> *</span>
          </Label>
          <Textarea
            value={form.anythingElse ?? ""}
            onChange={(e) => set("anythingElse", e.target.value || undefined)}
            placeholder="Past export experience, ambitions, challenges or other useful context."
          />
        </div>
      </Panel>

      <Panel n="05" title="Public profile" subtitle="What buyers see when your opportunity card is published.">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-line bg-brand-bg-alt">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-brand-muted">No logo</span>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block cursor-pointer rounded-lg border border-brand-line px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-bg-alt">
              {logoUp.isPending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={logoUp.isPending}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await logoUp.mutateAsync(f);
                  e.target.value = "";
                }}
              />
            </label>
            {logoUrl && (
              <button
                type="button"
                className="block text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                disabled={logoDel.isPending}
                onClick={() => logoDel.mutate()}
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Public description <span className="text-brand-teal">*</span></Label>
          <p className="text-xs text-brand-muted">
            A short, public blurb about your company shown on the marketplace and your profile page.
          </p>
          <Textarea
            value={form.publicDescription ?? ""}
            onChange={(e) => set("publicDescription", e.target.value || undefined)}
            placeholder="e.g. Family-owned German biscuit manufacturer exporting to 12 markets since 1998."
          />
        </div>
      </Panel>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {savedMsg && <p className="text-xs text-green-700">Profile saved.</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={save.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
