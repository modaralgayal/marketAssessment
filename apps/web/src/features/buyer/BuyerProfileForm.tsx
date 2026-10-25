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
  ApiError,
  type BuyerProfileInput,
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
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setForm(existing);
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

  const isRetailer = (form.roles ?? []).includes("RETAILER");
  const isImporter = (form.roles ?? []).includes("IMPORTER_DISTRIBUTOR");

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <Panel
        n="01"
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
        n="02"
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
        n="03"
        title="Categories & portfolio"
        subtitle="Shared portfolio information for retailers and distributors."
      >
        <ListField
          label="Which categories do you work with?"
          value={form.categories ?? []}
          onChange={(v) => set("categories", v)}
          placeholder="Snacks, Beverages"
        />
        <Field label="What specific products does your portfolio consist of?">
          <Textarea value={form.portfolioProducts ?? ""} onChange={(e) => set("portfolioProducts", e.target.value || undefined)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Do you have your own private-label brand?">
            <select
              value={form.privateLabel ?? ""}
              onChange={(e) => set("privateLabel", e.target.value || undefined)}
              className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
            >
              <option value="">Select an option</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="TO_CONFIRM">To be confirmed</option>
            </select>
          </Field>
          <TextField label="Private-label brand name" value={form.privateLabelName ?? ""} onChange={(v) => set("privateLabelName", v || undefined)} />
          <TextField label="Private-label categories" value={form.privateLabelCategories ?? ""} onChange={(v) => set("privateLabelCategories", v || undefined)} />
        </div>
        <PortfolioDocs enabled={loaded} />
      </Panel>

      {isImporter && (
        <Panel
          n="04"
          title="Importer & distributor profile"
          subtitle="Describe your operations, channel coverage and portfolio development."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Distribution role" value={form.distributionRole ?? ""} onChange={(v) => set("distributionRole", v || undefined)} />
            <TextField label="Warehouse" value={form.warehouse ?? ""} onChange={(v) => set("warehouse", v || undefined)} />
            <TextField label="Warehouse arrangement" value={form.warehouseArrangement ?? ""} onChange={(v) => set("warehouseArrangement", v || undefined)} />
            <TextField label="Vehicles" value={form.vehicles ?? ""} onChange={(v) => set("vehicles", v || undefined)} />
            <TextField label="Vehicle arrangement" value={form.vehicleArrangement ?? ""} onChange={(v) => set("vehicleArrangement", v || undefined)} />
            <TextField label="Sales reach mode" value={form.salesReachMode ?? ""} onChange={(v) => set("salesReachMode", v || undefined)} />
            <TextField label="Distribution geography" value={form.distributionGeography ?? ""} onChange={(v) => set("distributionGeography", v || undefined)} />
            <TextField label="Distribution product type" value={form.distributionProductType ?? ""} onChange={(v) => set("distributionProductType", v || undefined)} />
            <TextField label="Sales points" value={form.salesPoints?.toString() ?? ""} onChange={(v) => set("salesPoints", v ? Number(v) : undefined)} />
          </div>
          <ListField label="Storage" value={form.storage ?? []} onChange={(v) => set("storage", v)} placeholder="Ambient, Chilled, Frozen" />
          <ListField label="Channels" value={form.channels ?? []} onChange={(v) => set("channels", v)} placeholder="Retail, HORECA, Online" />
          <TextField label="Channel basis" value={form.channelBasis ?? ""} onChange={(v) => set("channelBasis", v || undefined)} />
          <Field label="Expand portfolio?">
            <select
              value={form.expandPortfolio ?? ""}
              onChange={(e) => set("expandPortfolio", e.target.value || undefined)}
              className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
            >
              <option value="">Select an option</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </Field>
          <TextField label="Expansion products" value={form.expansionProducts ?? ""} onChange={(v) => set("expansionProducts", v || undefined)} />
        </Panel>
      )}

      {isRetailer && (
        <Panel
          n="05"
          title="Retailer profile"
          subtitle="Describe your retail operation, purchasing office and assortment plans."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Retail geography" value={form.retailGeography ?? ""} onChange={(v) => set("retailGeography", v || undefined)} />
            <TextField label="Store count" value={form.storeCount?.toString() ?? ""} onChange={(v) => set("storeCount", v ? Number(v) : undefined)} />
            <TextField label="Retail mix basis" value={form.retailMixBasis ?? ""} onChange={(v) => set("retailMixBasis", v || undefined)} />
            <TextField label="Assortment plan" value={form.assortmentPlan ?? ""} onChange={(v) => set("assortmentPlan", v || undefined)} />
            <TextField label="Retail product type" value={form.retailProductType ?? ""} onChange={(v) => set("retailProductType", v || undefined)} />
            <TextField label="Retail delivery" value={form.retailDelivery ?? ""} onChange={(v) => set("retailDelivery", v || undefined)} />
            <TextField label="Purchasing subsidiary name" value={form.purchasingSubsidiaryName ?? ""} onChange={(v) => set("purchasingSubsidiaryName", v || undefined)} />
          </div>
          <ListField label="Retail formats" value={form.retailFormats ?? []} onChange={(v) => set("retailFormats", v)} placeholder="Supermarket, Convenience" />
          <Field label="Purchasing structure">
            <select
              value={form.purchasingStructure ?? ""}
              onChange={(e) => set("purchasingStructure", e.target.value || undefined)}
              className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
            >
              <option value="">Select an option</option>
              <option value="CENTRAL">Centrally</option>
              <option value="REGION">By region</option>
              <option value="STORE">By store</option>
              <option value="COMBINATION">Combination</option>
            </select>
          </Field>
          <Field label="Retail supply">
            <select
              value={form.retailSupply ?? ""}
              onChange={(e) => set("retailSupply", e.target.value || undefined)}
              className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
            >
              <option value="">Select an option</option>
              <option value="directImport">Direct import</option>
              <option value="localSupplier">Local supplier</option>
              <option value="both">Both</option>
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Direct import %" value={form.directImportPercent?.toString() ?? ""} onChange={(v) => set("directImportPercent", v ? Number(v) : undefined)} />
            <TextField label="Local supplier %" value={form.localSupplierPercent?.toString() ?? ""} onChange={(v) => set("localSupplierPercent", v ? Number(v) : undefined)} />
          </div>
          <TextField label="Retail expansion products" value={form.retailExpansionProducts ?? ""} onChange={(v) => set("retailExpansionProducts", v || undefined)} />
        </Panel>
      )}

      <Panel
        n="06"
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

      {error && <p className="text-xs text-red-600">{error}</p>}
      {savedMsg && <p className="text-xs text-green-700">Profile saved.</p>}

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}
