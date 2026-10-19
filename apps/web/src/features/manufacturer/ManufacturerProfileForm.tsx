import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  fetchManufacturerProfile,
  upsertManufacturerProfile,
  uploadManufacturerCatalogue,
  fetchManufacturerCatalogueUrl,
  deleteManufacturerCatalogue,
  type ManufacturerProfileInput,
} from "../../lib/api";
import {
  REVENUE_OPTIONS,
  YES_NO_UNSURE_OPTIONS,
  OTHER_CERT_OPTIONS,
  GCC_MARKET_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  FROZEN_STORAGE_OPTIONS,
  SHELF_LIFE_OPTIONS,
  BRAND_APPROACH_OPTIONS,
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
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
  { key: "products", label: "Products" },
  { key: "prices", label: "Prices" },
  { key: "ingredients", label: "Ingredients" },
  { key: "certificates", label: "Certificates" },
  { key: "packaging", label: "Packaging" },
  { key: "logistics", label: "Logistics" },
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
      <Label>What does your catalogue / price list show?</Label>
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

function CatalogueUpload({ catalogueFileId }: { catalogueFileId?: string | null }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const upload = useMutation({
    mutationFn: (f: File) => uploadManufacturerCatalogue(f),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Upload failed."),
  });
  const remove = useMutation({
    mutationFn: () => deleteManufacturerCatalogue(),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["manufacturer-profile"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Remove failed."),
  });

  return (
    <div className="space-y-1.5">
      <Label>Catalogue / price list</Label>
      <p className="text-xs text-brand-muted">Upload your product catalogue or price list (PDF, Excel, Word or image, up to 10 MB).</p>
      <div className="flex flex-wrap items-center gap-2">
        {catalogueFileId ? (
          <>
            <a
              onClick={async () => {
                const { url } = await fetchManufacturerCatalogueUrl();
                window.open(url, "_blank", "noopener");
              }}
              className="text-xs font-medium text-brand-teal hover:underline"
            >
              View catalogue
            </a>
            <button
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </button>
          </>
        ) : (
          <label className="cursor-pointer rounded-lg border border-brand-line px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-bg-alt">
            {uploading ? "Uploading…" : "Upload catalogue"}
            <input
              type="file"
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
        )}
      </div>
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
  { value: "shared", label: "Shared" },
  { value: "tradeSupport", label: "Trade support" },
  { value: "priceLed", label: "Price-led" },
];

const PRIVATE_LABEL_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "considering", label: "Considering" },
];

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
    // Expanded profile (reference prototype)
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
    <Card>
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Company</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Company name" value={form.companyName} onChange={(v) => set("companyName", v)} />
            <TextField label="Country" value={form.country} onChange={(v) => set("country", v)} />
            <TextField label="Website" value={form.website ?? ""} onChange={(v) => set("website", v || undefined)} />
            <TextField
              label="Industry / product category"
              value={form.industryCategory}
              onChange={(v) => set("industryCategory", v)}
            />
            <SelectField
              label="Annual revenue"
              value={form.annualRevenue}
              onChange={(v) => set("annualRevenue", (v || undefined) as ManufacturerProfileInput["annualRevenue"])}
              options={REVENUE_OPTIONS}
            />
            <TextField
              label="Years in business"
              value={form.yearsInBusiness ?? ""}
              onChange={(v) => set("yearsInBusiness", v || undefined)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Products & operations</h4>
          <div className="grid gap-3 sm:grid-cols-2">
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
            <SelectField
              label="Frozen storage"
              value={form.frozenStorage}
              onChange={(v) => set("frozenStorage", (v || undefined) as ManufacturerProfileInput["frozenStorage"])}
              options={FROZEN_STORAGE_OPTIONS}
            />
            <SelectField
              label="Shelf life"
              value={form.shelfLife}
              onChange={(v) => set("shelfLife", (v || undefined) as ManufacturerProfileInput["shelfLife"])}
              options={SHELF_LIFE_OPTIONS}
            />
            <SelectField
              label="Product adaptability"
              value={form.productAdaptability}
              onChange={(v) =>
                set("productAdaptability", (v || undefined) as ManufacturerProfileInput["productAdaptability"])
              }
              options={ADAPTABILITY_OPTIONS}
            />
            <SelectField
              label="Brand approach"
              value={form.brandApproach}
              onChange={(v) => set("brandApproach", (v || undefined) as ManufacturerProfileInput["brandApproach"])}
              options={BRAND_APPROACH_OPTIONS}
            />
          </div>
          <CheckboxGroup
            label="Other certifications"
            value={form.otherCerts}
            onChange={(v) => set("otherCerts", v as ManufacturerProfileInput["otherCerts"])}
            options={OTHER_CERT_OPTIONS}
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Target market</h4>
          <div className="grid gap-3 sm:grid-cols-2">
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
            <SelectField
              label="Target market potential"
              value={form.targetMarketPotential}
              onChange={(v) =>
                set("targetMarketPotential", (v || undefined) as ManufacturerProfileInput["targetMarketPotential"])
              }
              options={TARGET_POTENTIAL_OPTIONS}
            />
            <SelectField
              label="Production capacity available?"
              value={form.productionCapacity}
              onChange={(v) =>
                set("productionCapacity", (v || undefined) as ManufacturerProfileInput["productionCapacity"])
              }
              options={CAPACITY_OPTIONS}
            />
            <TextField
              label="MOQ"
              value={form.moq ?? ""}
              onChange={(v) => set("moq", v || undefined)}
            />
          </div>
          <CheckboxGroup
            label="Current GCC markets"
            value={form.currentGccMarkets}
            onChange={(v) => set("currentGccMarkets", v as ManufacturerProfileInput["currentGccMarkets"])}
            options={GCC_MARKET_OPTIONS}
          />
          <CheckboxGroup
            label="Sales channels"
            value={form.salesChannels}
            onChange={(v) => set("salesChannels", v as ManufacturerProfileInput["salesChannels"])}
            options={SALES_CHANNEL_OPTIONS}
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Additional profile details</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Number of export markets"
              value={form.exportCount?.toString() ?? ""}
              onChange={(v) => set("exportCount", v ? Number(v) : undefined)}
            />
            {form.exportCount !== undefined && form.exportCount > 0 && (
              <TextField
                label="Top markets"
                value={form.topMarkets ?? ""}
                onChange={(v) => set("topMarkets", v || undefined)}
                placeholder="e.g. KSA, UAE, Qatar"
              />
            )}
            <TextField label="Known for" value={form.knownFor ?? ""} onChange={(v) => set("knownFor", v || undefined)} />
            <TextField label="Logistics" value={form.logistics ?? ""} onChange={(v) => set("logistics", v || undefined)} />
            <TextField
              label="Pictures / gallery link"
              value={form.pictures ?? ""}
              onChange={(v) => set("pictures", v || undefined)}
            />
            <TextField label="USP" value={form.usp ?? ""} onChange={(v) => set("usp", v || undefined)} />
          </div>
          <RadioGroup
            label="Branding approach"
            value={form.branding}
            onChange={(v) => set("branding", v || undefined)}
            options={BRANDING_OPTIONS}
          />
          <RadioGroup
            label="Private label"
            value={form.privateLabel}
            onChange={(v) => set("privateLabel", v || undefined)}
            options={PRIVATE_LABEL_OPTIONS}
          />
          <CheckboxGroup
            label="Certifications"
            value={form.certs}
            onChange={(v) => set("certs", v)}
            options={CERT_OPTIONS}
          />
          <CatalogueUpload catalogueFileId={existing?.catalogueFileId} />
          <CatalogueCoverage
            value={form.catalogueCoverage}
            onChange={(v) => set("catalogueCoverage", v)}
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Decision-maker contact</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" value={form.contactFullName} onChange={(v) => set("contactFullName", v)} />
            <TextField label="Title / position" value={form.contactTitle} onChange={(v) => set("contactTitle", v)} />
            <TextField label="Email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
            <TextField
              label="Phone"
              value={form.contactPhone ?? ""}
              onChange={(v) => set("contactPhone", v || undefined)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">About</h4>
          <div className="space-y-1.5">
            <Label>Company info</Label>
            <Textarea
              value={form.companyInfo ?? ""}
              onChange={(e) => set("companyInfo", e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Product category (summary)</Label>
            <Input
              value={form.productCategory ?? ""}
              onChange={(e) => set("productCategory", e.target.value || undefined)}
            />
          </div>
        </section>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {savedMsg && <p className="text-xs text-green-700">Profile saved.</p>}

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
