import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  fetchBuyerProfile,
  upsertBuyerProfile,
  fetchBuyerPortfolio,
  uploadBuyerPortfolio,
  deleteBuyerPortfolio,
  fetchBuyerPortfolioUrl,
  uploadBuyerLogo,
  deleteBuyerLogo,
  ApiError,
  type BuyerProfileInput,
  type BuyerProfileDto,
} from "../../lib/api";
import { GCC_MARKET_OPTIONS } from "@mea/shared";

function Field({
  label,
  children,
  error,
  id,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  id?: string;
}) {
  return (
    <div className="space-y-1.5" id={id} data-field-error={error ? "" : undefined}>
      <Label>
        {label}
        {label.endsWith("*") ? "" : null}
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
    <Field label={label + (required ? " *" : "")} error={error} id={id}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? "border-red-500 focus:border-red-500" : undefined}
      />
    </Field>
  );
}

function CheckboxGroup({
  label,
  value,
  onChange,
  options,
  error,
  id,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  id?: string;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <Field label={label} error={error} id={id}>
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
    </Field>
  );
}

function ListField({
  label,
  value,
  onChange,
  placeholder,
  error,
  id,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  error?: string;
  id?: string;
}) {
  return (
    <Field label={label} error={error} id={id}>
      <Input
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        placeholder={placeholder}
        className={error ? "border-red-500 focus:border-red-500" : undefined}
      />
    </Field>
  );
}

function Panel({
  n,
  title,
  subtitle,
  children,
}: {
  n: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-brand-line bg-white p-5 sm:p-6">
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

function PortfolioDocs({ enabled }: { enabled: boolean }) {
  const qc = useQueryClient();
  const [err, setErr] = useState<string | null>(null);
  const { data: files = [] } = useQuery({
    queryKey: ["buyer-portfolio"],
    queryFn: fetchBuyerPortfolio,
    enabled,
  });
  const upload = useMutation({
    mutationFn: (f: File) => uploadBuyerPortfolio(f),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["buyer-portfolio"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Upload failed."),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteBuyerPortfolio(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["buyer-portfolio"] }),
    onError: (e) => setErr(e instanceof Error ? e.message : "Remove failed."),
  });

  return (
    <Field label="Portfolio document / assortment link (optional)">
      {!enabled && (
        <p className="text-xs text-brand-muted">Save your profile first to enable document uploads.</p>
      )}
      {enabled && (
        <>
          <ul className="space-y-1">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg border border-brand-line px-3 py-1.5 text-sm">
                <a
                  onClick={async () => {
                    const { url } = await fetchBuyerPortfolioUrl(f.id);
                    window.open(url, "_blank", "noopener");
                  }}
                  className="text-brand-teal hover:underline"
                >
                  {f.originalName}
                </a>
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove.mutate(f.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <label className="mt-1 inline-block cursor-pointer text-xs font-medium text-brand-teal hover:underline">
            ＋ Upload document
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await upload.mutateAsync(f);
                e.target.value = "";
              }}
            />
          </label>
        </>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </Field>
  );
}

// Reference-prototype option sets (mirror the buyer dashboard spec exactly).
const BUYER_CATEGORY_OPTIONS = [
  { value: "Confectionery", label: "Confectionery" },
  { value: "Biscuits & bakery", label: "Biscuits & bakery" },
  { value: "Snacks", label: "Snacks" },
  { value: "Beverages", label: "Beverages" },
  { value: "Dairy", label: "Dairy" },
  { value: "Frozen foods", label: "Frozen foods" },
  { value: "Meat & seafood", label: "Meat & seafood" },
  { value: "Fruit & vegetables", label: "Fruit & vegetables" },
  { value: "Grocery & pantry", label: "Grocery & pantry" },
  { value: "Ingredients", label: "Ingredients" },
  { value: "Other", label: "Other" },
];

const STORAGE_OPTIONS = [
  { value: "Ambient", label: "Ambient" },
  { value: "Chilled", label: "Chilled" },
  { value: "Frozen", label: "Frozen" },
  { value: "Other", label: "Other" },
];

const CHANNEL_OPTIONS = [
  { value: "Modern trade", label: "Modern trade" },
  { value: "Traditional trade", label: "Traditional trade" },
  { value: "Discount stores", label: "Discount stores" },
  { value: "Wholesale", label: "Wholesale" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "HORECA", label: "HORECA" },
];

const CHANNEL_BASIS_OPTIONS = [
  { value: "Sales revenue", label: "Sales revenue" },
  { value: "Sales volume", label: "Sales volume" },
  { value: "Another basis", label: "Another basis" },
  { value: "Not yet defined", label: "Not yet defined" },
];

const YES_NO_CONFIRM = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "TO_CONFIRM", label: "To be confirmed" },
];

const DISTRIBUTION_ROLE_OPTIONS = [
  { value: "Importer", label: "Importer" },
  { value: "Distributor", label: "Distributor" },
  { value: "Both", label: "Both" },
];

const VEHICLE_ARRANGEMENT_OPTIONS = [
  { value: "Owned", label: "Owned" },
  { value: "Contracted", label: "Contracted" },
  { value: "Combination", label: "Combination" },
];

const WAREHOUSE_ARRANGEMENT_OPTIONS = [
  { value: "Owned", label: "Owned" },
  { value: "Leased", label: "Leased" },
  { value: "Logistics partner", label: "Logistics partner" },
  { value: "Combination", label: "Combination" },
];

const REACH_MODE_OPTIONS = [
  { value: "Directly", label: "Directly" },
  { value: "Through other distributors", label: "Through other distributors" },
  { value: "Both", label: "Both" },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: "Branded products", label: "Branded products" },
  { value: "Private-label products", label: "Private-label products" },
  { value: "Both", label: "Both" },
];

const RETAIL_FORMAT_OPTIONS = [
  { value: "Supermarkets", label: "Supermarkets" },
  { value: "Hypermarkets", label: "Hypermarkets" },
  { value: "Convenience stores", label: "Convenience stores" },
  { value: "Discount stores", label: "Discount stores" },
  { value: "Specialist stores", label: "Specialist stores" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Other", label: "Other" },
];

const PURCHASING_STRUCTURE_OPTIONS = [
  { value: "Centrally", label: "Centrally" },
  { value: "By region", label: "By region" },
  { value: "By store", label: "By store" },
  { value: "Combination", label: "Combination" },
];

const RETAIL_SUPPLY_OPTIONS = [
  { value: "Import directly", label: "Import directly" },
  { value: "Purchase from local suppliers", label: "Purchase from local suppliers" },
  { value: "Both", label: "Both" },
];

const RETAIL_MIX_BASIS_OPTIONS = [
  { value: "Purchase value", label: "Purchase value" },
  { value: "Purchase volume", label: "Purchase volume" },
  { value: "Another basis", label: "Another basis" },
  { value: "Not yet defined", label: "Not yet defined" },
];

const RETAIL_DELIVERY_OPTIONS = [
  { value: "Distribution centres", label: "Distribution centres" },
  { value: "Directly to stores", label: "Directly to stores" },
  { value: "Combination", label: "Combination" },
  { value: "Another arrangement", label: "Another arrangement" },
];

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
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
    <Field label={label + (required ? " *" : "")} error={error} id={id}>
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

export default function BuyerProfileForm() {
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery({
    queryKey: ["buyer-profile"],
    queryFn: () => fetchBuyerProfile(),
    retry: false,
  });

  const [form, setForm] = useState<BuyerProfileInput>({
    buyerType: "IMPORTER_DISTRIBUTOR",
    companyName: "",
    country: "",
    website: undefined,
    tradingName: undefined,
    hqCountry: undefined,
    hqCity: undefined,
    operatingCountries: [],
    categories: [],
    portfolioInfo: undefined,
    portfolioProducts: undefined,
    privateLabel: undefined,
    privateLabelName: undefined,
    privateLabelCategories: undefined,
    roles: [],
    distributionRole: undefined,
    warehouse: undefined,
    warehouseArrangement: undefined,
    storage: [],
    vehicles: undefined,
    vehicleArrangement: undefined,
    salesReachMode: undefined,
    distributionGeography: undefined,
    distributionProductType: undefined,
    salesPoints: undefined,
    channels: [],
    channelBasis: undefined,
    expandPortfolio: undefined,
    expansionProducts: undefined,
    retailFormats: [],
    retailGeography: undefined,
    storeCount: undefined,
    retailMixBasis: undefined,
    assortmentPlan: undefined,
    retailProductType: undefined,
    retailDelivery: undefined,
    purchasingStructure: undefined,
    retailSupply: undefined,
    directImportPercent: undefined,
    localSupplierPercent: undefined,
    retailExpansionProducts: undefined,
    purchasingSubsidiaryName: undefined,
    contactFullName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: undefined,
    contacts: undefined,
    sourcingNeeds: undefined,
    targetMarkets: [],
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
  // on the earliest missing/invalid input. Runs once per new set of errors.
  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const el = document.querySelector<HTMLElement>("[data-field-error]");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [fieldErrors]);

  const save = useMutation({
    mutationFn: () => upsertBuyerProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyer-profile"] });
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

  const set = <K extends keyof BuyerProfileInput>(key: K, val: BuyerProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // Profile logo (image) upload + removal.
  const logoUp = useMutation({
    mutationFn: (f: File) => uploadBuyerLogo(f),
    onSuccess: (dto: BuyerProfileDto) => {
      setLogoUrl(dto.logoUrl ?? null);
      qc.invalidateQueries({ queryKey: ["buyer-profile"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to upload logo."),
  });
  const logoDel = useMutation({
    mutationFn: () => deleteBuyerLogo(),
    onSuccess: () => {
      setLogoUrl(null);
      qc.invalidateQueries({ queryKey: ["buyer-profile"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to remove logo."),
  });

  const isRetailer = (form.roles ?? []).includes("RETAILER");
  const isImporter = (form.roles ?? []).includes("IMPORTER_DISTRIBUTOR");

  // Section numbers are assigned from a running counter so the conditional
  // Importer / Retailer panels don't leave gaps in the visible sequence.
  let sectionNo = 0;
  const nextSection = () => String(++sectionNo).padStart(2, "0");

  // Catch-all record for deep conditional text fields (storageOther, retailOther,
  // purchasingThirdParty, retailDeliveryOther, channelBasisOther).
  const details = (form.details ?? {}) as Record<string, string | undefined>;
  const setDetail = (key: string, val: string | undefined) =>
    set("details", { ...details, [key]: val } as BuyerProfileInput["details"]);

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <Panel
        n={nextSection()}
        title="Company information"
        subtitle="Shared information for both buyer types."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Company name" required value={form.companyName} onChange={(v) => set("companyName", v)} error={fieldErrors["companyName"]?.[0]} id="field-companyName" />
          <TextField label="Country" required value={form.country} onChange={(v) => set("country", v)} error={fieldErrors["country"]?.[0]} id="field-country" />
          <TextField label="Trading name" value={form.tradingName ?? ""} onChange={(v) => set("tradingName", v || undefined)} />
          <TextField label="Website" value={form.website ?? ""} onChange={(v) => set("website", v || undefined)} />
          <TextField label="Headquarters country" required value={form.hqCountry ?? ""} onChange={(v) => set("hqCountry", v || undefined)} error={fieldErrors["hqCountry"]?.[0]} id="field-hqCountry" />
          <TextField label="Headquarters city" required value={form.hqCity ?? ""} onChange={(v) => set("hqCity", v || undefined)} error={fieldErrors["hqCity"]?.[0]} id="field-hqCity" />
          <TextField label="Business email" required value={form.contactEmail} onChange={(v) => set("contactEmail", v)} error={fieldErrors["contactEmail"]?.[0]} id="field-contactEmail" />
          <TextField label="Contact name" required value={form.contactFullName} onChange={(v) => set("contactFullName", v)} error={fieldErrors["contactFullName"]?.[0]} id="field-contactFullName" />
          <TextField label="Position" required value={form.contactTitle} onChange={(v) => set("contactTitle", v)} error={fieldErrors["contactTitle"]?.[0]} id="field-contactTitle" />
          <TextField label="Phone" value={form.contactPhone ?? ""} onChange={(v) => set("contactPhone", v || undefined)} />
        </div>
        <ListField
          label="Countries in which your company operates"
          value={form.operatingCountries ?? []}
          onChange={(v) => set("operatingCountries", v)}
          placeholder="UAE, KSA, Qatar"
        />
      </Panel>

      <Panel
        n={nextSection()}
        title="Your buyer type"
        subtitle="Select one or both. Each type has its own profile section."
      >
        <CheckboxGroup
          label="What type of buyer are you?"
          value={form.roles ?? []}
          onChange={(v) => set("roles", v)}
          options={[
            { value: "RETAILER", label: "Retailer" },
            { value: "IMPORTER_DISTRIBUTOR", label: "Importer and distributor" },
          ]}
        />
      </Panel>

      <Panel
        n={nextSection()}
        title="Categories & portfolio"
        subtitle="Shared portfolio information for retailers and distributors."
      >
        <CheckboxGroup
          label="Which categories do you work with?"
          value={form.categories ?? []}
          onChange={(v) => set("categories", v)}
          options={BUYER_CATEGORY_OPTIONS}
        />
        <Field label="What specific products does your portfolio consist of?">
          <Textarea value={form.portfolioProducts ?? ""} onChange={(e) => set("portfolioProducts", e.target.value || undefined)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Do you have your own private-label brand?"
            value={form.privateLabel}
            onChange={(v) => set("privateLabel", v || undefined)}
            options={YES_NO_CONFIRM}
          />
          {form.privateLabel === "YES" && (
            <>
              <TextField label="Private-label brand name" value={form.privateLabelName ?? ""} onChange={(v) => set("privateLabelName", v || undefined)} />
              <TextField label="Which categories does it cover?" value={form.privateLabelCategories ?? ""} onChange={(v) => set("privateLabelCategories", v || undefined)} />
            </>
          )}
        </div>
        <PortfolioDocs enabled={loaded} />
      </Panel>

      {isImporter && (
        <Panel
          n={nextSection()}
          title="Importer & distributor profile"
          subtitle="Describe your operations, channel coverage and portfolio development."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Do you act as an importer, a distributor, or both?" value={form.distributionRole} onChange={(v) => set("distributionRole", v || undefined)} options={DISTRIBUTION_ROLE_OPTIONS} />
            <SelectField label="Do you have warehousing?" value={form.warehouse} onChange={(v) => set("warehouse", v || undefined)} options={YES_NO_CONFIRM} />
            {form.warehouse === "YES" && (
              <SelectField label="Warehousing arrangement" value={form.warehouseArrangement} onChange={(v) => set("warehouseArrangement", v || undefined)} options={WAREHOUSE_ARRANGEMENT_OPTIONS} />
            )}
            <SelectField label="Do you have distribution vehicles?" value={form.vehicles} onChange={(v) => set("vehicles", v || undefined)} options={YES_NO_CONFIRM} />
            {form.vehicles === "YES" && (
              <SelectField label="Distribution vehicle arrangement" value={form.vehicleArrangement} onChange={(v) => set("vehicleArrangement", v || undefined)} options={VEHICLE_ARRANGEMENT_OPTIONS} />
            )}
            <TextField label="Total number of sales points you reach" value={form.salesPoints?.toString() ?? ""} onChange={(v) => set("salesPoints", v ? Number(v) : undefined)} />
            <SelectField label="Do you reach sales points directly, through other distributors, or both?" value={form.salesReachMode} onChange={(v) => set("salesReachMode", v || undefined)} options={REACH_MODE_OPTIONS} />
          </div>
          {form.warehouse === "YES" && (
            <CheckboxGroup label="What storage conditions can you support?" value={form.storage ?? []} onChange={(v) => set("storage", v)} options={STORAGE_OPTIONS} />
          )}
          {form.warehouse === "YES" && (form.storage ?? []).includes("Other") && (
            <TextField label="Other storage conditions" value={details.storageOther ?? ""} onChange={(v) => setDetail("storageOther", v || undefined)} />
          )}
          <CheckboxGroup label="Which channels do you cover?" value={form.channels ?? []} onChange={(v) => set("channels", v)} options={CHANNEL_OPTIONS} />
          {(form.channels ?? []).length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(form.channels ?? []).map((ch) => (
                <TextField
                  key={ch}
                  label={`${ch} (%)`}
                  value={(form.channelPercentages?.[ch] ?? "")?.toString() ?? ""}
                  onChange={(v) => {
                    const next = { ...(form.channelPercentages ?? {}) };
                    if (v) next[ch] = Number(v);
                    else delete next[ch];
                    set("channelPercentages", next);
                  }}
                />
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Basis for your channel percentages" value={form.channelBasis} onChange={(v) => set("channelBasis", v || undefined)} options={CHANNEL_BASIS_OPTIONS} />
            {form.channelBasis === "Another basis" && (
              <TextField label="Other measurement basis" value={details.channelBasisOther ?? ""} onChange={(v) => setDetail("channelBasisOther", v || undefined)} />
            )}
            <SelectField label="Are you actively seeking to expand your portfolio?" value={form.expandPortfolio} onChange={(v) => set("expandPortfolio", v || undefined)} options={YES_NO_CONFIRM} />
            <SelectField label="Are you seeking branded products, private-label products, or both?" value={form.distributionProductType} onChange={(v) => set("distributionProductType", v || undefined)} options={PRODUCT_TYPE_OPTIONS} />
          </div>
          {form.expandPortfolio === "YES" && (
            <Field label="Which categories or products interest you?">
              <Textarea value={form.expansionProducts ?? ""} onChange={(e) => set("expansionProducts", e.target.value || undefined)} />
            </Field>
          )}
          <Field label="Geographical reach: countries, regions or cities">
            <Textarea value={form.distributionGeography ?? ""} onChange={(e) => set("distributionGeography", e.target.value || undefined)} />
          </Field>
        </Panel>
      )}

      {isRetailer && (
        <Panel
          n={nextSection()}
          title="Retailer profile"
          subtitle="Describe your retail operation, purchasing office and assortment plans."
        >
          <CheckboxGroup label="Which retail formats do you operate?" value={form.retailFormats ?? []} onChange={(v) => set("retailFormats", v)} options={RETAIL_FORMAT_OPTIONS} />
          {form.retailFormats.includes("Other") && (
            <TextField label="Other retail format" value={details.retailOther ?? ""} onChange={(v) => setDetail("retailOther", v || undefined)} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="How many physical stores do you operate, if applicable?" value={form.storeCount?.toString() ?? ""} onChange={(v) => set("storeCount", v ? Number(v) : undefined)} />
            <SelectField label="Do you purchase centrally, by region, by store, or through a combination?" value={form.purchasingStructure} onChange={(v) => set("purchasingStructure", v || undefined)} options={PURCHASING_STRUCTURE_OPTIONS} />
            <SelectField label="Is your purchasing office contracted to a third party?" value={form.purchasingOutsourced} onChange={(v) => set("purchasingOutsourced", v || undefined)} options={YES_NO_CONFIRM} />
            {form.purchasingOutsourced === "YES" && (
              <TextField label="Third-party company / arrangement" value={details.purchasingThirdParty ?? ""} onChange={(v) => setDetail("purchasingThirdParty", v || undefined)} />
            )}
            <SelectField label="Is your purchasing office managed by a subsidiary company?" value={form.purchasingSubsidiary} onChange={(v) => set("purchasingSubsidiary", v || undefined)} options={YES_NO_CONFIRM} />
            {form.purchasingSubsidiary === "YES" && (
              <TextField label="Subsidiary company name" value={form.purchasingSubsidiaryName ?? ""} onChange={(v) => set("purchasingSubsidiaryName", v || undefined)} />
            )}
            <SelectField label="Do you import directly, purchase from local suppliers, or both?" value={form.retailSupply} onChange={(v) => set("retailSupply", v || undefined)} options={RETAIL_SUPPLY_OPTIONS} />
            <SelectField label="Basis for the sourcing percentages" value={form.retailMixBasis} onChange={(v) => set("retailMixBasis", v || undefined)} options={RETAIL_MIX_BASIS_OPTIONS} />
            <SelectField label="Are you planning to expand or change your assortment in the next 6–12 months?" value={form.assortmentPlan} onChange={(v) => set("assortmentPlan", v || undefined)} options={YES_NO_CONFIRM} />
            <SelectField label="Are you seeking branded products, private-label products, or both?" value={form.retailProductType} onChange={(v) => set("retailProductType", v || undefined)} options={PRODUCT_TYPE_OPTIONS} />
            <SelectField label="Where should suppliers deliver?" value={form.retailDelivery} onChange={(v) => set("retailDelivery", v || undefined)} options={RETAIL_DELIVERY_OPTIONS} />
          </div>
          {form.retailDelivery === "Another arrangement" && (
            <TextField label="Other delivery arrangement" value={details.retailDeliveryOther ?? ""} onChange={(v) => setDetail("retailDeliveryOther", v || undefined)} />
          )}
          <Field label="Geographical reach of your stores and online operation">
            <Textarea value={form.retailGeography ?? ""} onChange={(e) => set("retailGeography", e.target.value || undefined)} />
          </Field>
          <Field label="Where is your purchasing office located?">
            <Textarea value={form.purchasingOffice ?? ""} onChange={(e) => set("purchasingOffice", e.target.value || undefined)} />
          </Field>
          {form.retailSupply === "Both" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Imported directly (%)" value={form.directImportPercent?.toString() ?? ""} onChange={(v) => set("directImportPercent", v ? Number(v) : undefined)} />
              <TextField label="Purchased from local suppliers (%)" value={form.localSupplierPercent?.toString() ?? ""} onChange={(v) => set("localSupplierPercent", v ? Number(v) : undefined)} />
            </div>
          )}
          {form.assortmentPlan === "YES" && (
            <Field label="Which categories or products interest you?">
              <Textarea value={form.retailExpansionProducts ?? ""} onChange={(e) => set("retailExpansionProducts", e.target.value || undefined)} />
            </Field>
          )}
        </Panel>
      )}

      <Panel
        n={nextSection()}
        title="Sourcing focus"
        subtitle="What you're looking for right now (kept with your profile)."
      >
        <Field label="What are you sourcing?">
          <Textarea value={form.sourcingNeeds ?? ""} onChange={(e) => set("sourcingNeeds", e.target.value || undefined)} />
        </Field>
        <CheckboxGroup
          label="Target GCC markets"
          value={form.targetMarkets ?? []}
          onChange={(v) => set("targetMarkets", v as BuyerProfileInput["targetMarkets"])}
          options={GCC_MARKET_OPTIONS}
        />
      </Panel>

      <Panel
        n={nextSection()}
        title="Public profile"
        subtitle="What manufacturers see when you message them or on your profile page."
      >
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
        <Field label="Public description">
          <Textarea
            value={form.publicDescription ?? ""}
            onChange={(e) => set("publicDescription", e.target.value || undefined)}
            placeholder="A short blurb about your company shown to manufacturers when you reach out."
          />
        </Field>
      </Panel>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {savedMsg && <p className="text-xs text-green-700">Profile saved.</p>}

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}
