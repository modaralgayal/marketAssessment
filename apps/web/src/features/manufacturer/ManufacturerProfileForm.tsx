import { useEffect, useState, type ReactNode } from "react";
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
  type ManufacturerProfileInput,
  type ManufacturerFileInfo,
} from "../../lib/api";
import {
  REVENUE_OPTIONS,
  YES_NO_UNSURE_OPTIONS,
  OTHER_CERT_OPTIONS,
  GCC_MARKET_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  FROZEN_STORAGE_OPTIONS,
  TARGET_POTENTIAL_OPTIONS,
  CAPACITY_OPTIONS,
  SFDA_OPTIONS,
  ADAPTABILITY_OPTIONS,
} from "@mea/shared";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-brand-teal"> *</span>}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-brand-teal"> *</span>}
      </Label>
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
    </div>
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

const CERT_OPTIONS = [
  { value: "Halal", label: "Halal" },
  { value: "BRCGS", label: "BRCGS" },
  { value: "IFS", label: "IFS" },
  { value: "FSSC", label: "FSSC" },
  { value: "ISO", label: "ISO" },
  { value: "HACCP", label: "HACCP" },
  { value: "Organic", label: "Organic" },
  { value: "Other", label: "Other" },
  { value: "None", label: "None" },
];

const BRANDING_OPTIONS = [
  { value: "brandLed", label: "Brand-led" },
  { value: "shared", label: "Shared investment" },
  { value: "tradeSupport", label: "Trade support" },
  { value: "priceLed", label: "Price-led" },
];

const PRIVATE_LABEL_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "considering", label: "Considering" },
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
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["manufacturer-profile"],
    queryFn: () => fetchManufacturerProfile(),
    retry: false,
  });

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
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setForm(existing);
      setLoaded(true);
    }
  }, [existing, loaded]);

  const save = useMutation({
    mutationFn: () => upsertManufacturerProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
      setSavedMsg(true);
      setError(null);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to save."),
  });

  const set = <K extends keyof ManufacturerProfileInput>(key: K, val: ManufacturerProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <Panel
        n="01"
        title="Company profile"
        subtitle="Basic information about your business. Fields marked * are required."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Company name" required value={form.companyName} onChange={(v) => set("companyName", v)} />
          <TextField label="Country" required value={form.country} onChange={(v) => set("country", v)} />
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
          />
          <SelectField
            label="Annual revenue"
            required
            value={form.annualRevenue}
            onChange={(v) => set("annualRevenue", (v || undefined) as ManufacturerProfileInput["annualRevenue"])}
            options={REVENUE_OPTIONS}
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
            options={FROZEN_STORAGE_OPTIONS}
          />
          <TextField
            label="Label languages currently available"
            required
            value={form.labelLanguages ?? ""}
            onChange={(v) => set("labelLanguages", v || undefined)}
            placeholder="e.g. English, Arabic, French"
          />
          <SelectField
            label="Product adaptability"
            required
            value={form.productAdaptability}
            onChange={(v) =>
              set("productAdaptability", (v || undefined) as ManufacturerProfileInput["productAdaptability"])
            }
            options={ADAPTABILITY_OPTIONS}
          />
          <TextField label="MOQ" required value={form.moq ?? ""} onChange={(v) => set("moq", v || undefined)} />
          <SelectField
            label="Production capacity available?"
            required
            value={form.productionCapacity}
            onChange={(v) =>
              set("productionCapacity", (v || undefined) as ManufacturerProfileInput["productionCapacity"])
            }
            options={CAPACITY_OPTIONS}
          />
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
          options={CERT_OPTIONS}
        />
        <CheckboxGroup
          label="Other certifications"
          value={form.otherCerts}
          onChange={(v) => set("otherCerts", v as ManufacturerProfileInput["otherCerts"])}
          options={OTHER_CERT_OPTIONS}
        />
        <RadioGroup
          label="Branding & promotional approach"
          required
          value={form.branding}
          onChange={(v) => set("branding", v || undefined)}
          options={BRANDING_OPTIONS}
        />
        <RadioGroup
          label="Do you offer private label manufacturing services?"
          required
          value={form.privateLabel}
          onChange={(v) => set("privateLabel", v || undefined)}
          options={PRIVATE_LABEL_OPTIONS}
        />
      </Panel>

      <Panel
        n="03"
        title="Target market"
        subtitle="Your export ambitions and channel priorities."
      >
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
        <CheckboxGroup
          label="Sales channels of interest (select all that apply)"
          value={form.salesChannels}
          onChange={(v) => set("salesChannels", v as ManufacturerProfileInput["salesChannels"])}
          options={SALES_CHANNEL_OPTIONS}
        />
        <div className="space-y-1.5">
          <Label>Channel strategy</Label>
          <Textarea
            value={form.channelStrategy ?? ""}
            onChange={(e) => set("channelStrategy", e.target.value || undefined)}
            placeholder="Describe your channel priorities and preferred approach to working with partners."
          />
        </div>
      </Panel>

      <Panel
        n="04"
        title="Decision-maker contact"
        subtitle="Who we'll speak with about the next steps."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" required value={form.contactFullName} onChange={(v) => set("contactFullName", v)} />
          <TextField label="Title / position" required value={form.contactTitle} onChange={(v) => set("contactTitle", v)} />
          <TextField label="Email address" required value={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
          <TextField
            label="Phone number"
            required
            value={form.contactPhone ?? ""}
            onChange={(v) => set("contactPhone", v || undefined)}
          />
          <SelectField
            label="Dedicated export contact?"
            value={form.exportContact === true ? "yes" : form.exportContact === false ? "no" : ""}
            onChange={(v) =>
              set("exportContact", v === "yes" ? true : v === "no" ? false : undefined)
            }
            options={[
              { value: "yes", label: "Yes, the person listed above" },
              { value: "no", label: "No, not currently" },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Anything else? (optional)</Label>
          <Textarea
            value={form.anythingElse ?? ""}
            onChange={(e) => set("anythingElse", e.target.value || undefined)}
            placeholder="Past export experience, ambitions, challenges or other useful context."
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
