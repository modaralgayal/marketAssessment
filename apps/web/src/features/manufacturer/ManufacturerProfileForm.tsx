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
import {
  YES_NO_UNSURE_OPTIONS,
  GCC_MARKET_OPTIONS,
  TARGET_POTENTIAL_OPTIONS,
  SFDA_OPTIONS,
} from "@mea/shared";

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
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-brand-teal"> *</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === o.value
                ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                : "border-brand-line text-brand-ink hover:bg-brand-bg-alt"
            }`}
          >
            {o.label}
          </button>
        ))}
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
      <div>
        <Label>Catalogue / price list <span className="text-brand-teal">*</span></Label>
        <p className="text-xs text-brand-muted">
          Attach one or more PDFs, or add a link. These become references you can attach to your opportunity cards.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-brand-line px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-bg-alt">
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
  { value: "brandLed", label: "Brand-led" },
  { value: "shared", label: "Shared investment" },
  { value: "tradeSupport", label: "Trade support" },
  { value: "priceLed", label: "Price-led" },
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

const TARGET_EXPORT_MARKET_OPTIONS = [
  ...GCC_MARKET_OPTIONS,
  { value: "WORLDWIDE", label: "Worldwide" },
  { value: "OTHER", label: "Other" },
];

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
    gccCurrentlyActive: undefined,
    currentGccMarkets: [],
    gccSituation: undefined,
    targetMarketPotential: undefined,
    targetMarketPotentialOther: undefined,
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
    companyInfo: undefined,
    exportCount: undefined,
    topMarkets: undefined,
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

  // After a failed save, scroll to the first highlighted field so the user lands
  // on the earliest missing/invalid input.
  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const el = document.querySelector<HTMLElement>("[data-field-error]");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fieldErrors]);

  const save = useMutation({
    mutationFn: () => upsertManufacturerProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
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

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <div className="space-y-4">
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
          {form.exportCount !== undefined && form.exportCount > 0 && (
            <TextField
              label="Top export markets"
              required
              value={form.topMarkets ?? ""}
              onChange={(v) => set("topMarkets", v || undefined)}
              placeholder="e.g. Germany, Poland, United Kingdom"
            />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Company info</Label>
            <Textarea
              value={form.companyInfo ?? ""}
              onChange={(e) => set("companyInfo", e.target.value || undefined)}
              placeholder="Company background (optional)"
            />
          </div>
          <TextField label="Known for" value={form.knownFor ?? ""} onChange={(v) => set("knownFor", v || undefined)} />
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
          <TextField label="MOQ" required value={form.moq ?? ""} onChange={(v) => set("moq", v || undefined)} />
          <TextField
            label="Lead time"
            required
            value={form.leadTimes ?? ""}
            onChange={(v) => set("leadTimes", v || undefined)}
            placeholder="e.g. 4–6 weeks from confirmed order"
          />
          <SelectField
            label="Halal certification"
            value={form.halalCert}
            onChange={(v) => set("halalCert", (v || undefined) as ManufacturerProfileInput["halalCert"])}
            options={YES_NO_UNSURE_OPTIONS}
          />
          <SelectField
            label="SFDA status"
            value={form.sfdaStatus}
            onChange={(v) => set("sfdaStatus", (v || undefined) as ManufacturerProfileInput["sfdaStatus"])}
            options={SFDA_OPTIONS}
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
          <SelectField
            label="Product adaptability"
            required
            value={form.productAdaptability}
            onChange={(v) =>
              set("productAdaptability", (v || undefined) as ManufacturerProfileInput["productAdaptability"])
            }
            options={ADAPTABILITY_PROFILE_OPTIONS}
          />
          <SelectField
            label="Production capacity available?"
            required
            value={form.productionCapacity}
            onChange={(v) =>
              set("productionCapacity", (v || undefined) as ManufacturerProfileInput["productionCapacity"])
            }
            options={CAPACITY_PROFILE_OPTIONS}
          />
        </div>
      </Panel>

      <Panel
        n="03"
        title="Target market"
        subtitle="Your export ambitions and channel priorities."
      >
        <SelectField
          label="Target export market"
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

        {/* GCC activity — retained profile extras */}
        <SelectField
          label="Currently active in GCC?"
          value={form.gccCurrentlyActive === true ? "YES" : form.gccCurrentlyActive === false ? "NO" : ""}
          onChange={(v) =>
            set(
              "gccCurrentlyActive",
              v === "YES" ? true : v === "NO" ? false : undefined,
            )
          }
          options={[
            { value: "YES", label: "Yes" },
            { value: "NO", label: "No" },
          ]}
        />
        <CheckboxGroup
          label="Current GCC markets"
          value={form.currentGccMarkets}
          onChange={(v) => set("currentGccMarkets", v as ManufacturerProfileInput["currentGccMarkets"])}
          options={GCC_MARKET_OPTIONS}
        />
        <SelectField
          label="Target market potential"
          value={form.targetMarketPotential}
          onChange={(v) =>
            set("targetMarketPotential", (v || undefined) as ManufacturerProfileInput["targetMarketPotential"])
          }
          options={TARGET_POTENTIAL_OPTIONS}
        />
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
              set("exportContact", v === "yes" ? true : v === "no" ? false : undefined)
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

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}
