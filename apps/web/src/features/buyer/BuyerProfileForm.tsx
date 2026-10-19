import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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
  type BuyerProfileInput,
} from "../../lib/api";
import { GCC_MARKET_OPTIONS } from "@mea/shared";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

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
    <Field label={label}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
    <Field label={label}>
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
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        placeholder={placeholder}
      />
    </Field>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
      <span className="rounded-md bg-brand-teal/10 px-1.5 py-0.5 text-xs text-brand-teal">{n}</span>
      {title}
    </h4>
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
    <Field label="Portfolio documents">
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
    categories: [],
    portfolioInfo: undefined,
    sourcingNeeds: undefined,
    targetMarkets: [],
    operatingCountries: [],
    roles: [],
    storage: [],
    channels: [],
    retailFormats: [],
    contactFullName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: undefined,
    contacts: undefined,
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
    mutationFn: () => upsertBuyerProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyer-profile"] });
      setSavedMsg(true);
      setError(null);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to save."),
  });

  const set = <K extends keyof BuyerProfileInput>(key: K, val: BuyerProfileInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const isRetailer = (form.roles ?? []).includes("RETAILER");
  const isImporter = (form.roles ?? []).includes("IMPORTER_DISTRIBUTOR");

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 01 Company */}
        <section className="space-y-3">
          <SectionTitle n="01" title="Company" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Buyer type">
              <select
                value={form.buyerType}
                onChange={(e) => set("buyerType", e.target.value as BuyerProfileInput["buyerType"])}
                className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
              >
                <option value="IMPORTER_DISTRIBUTOR">Importer / Distributor</option>
                <option value="RETAILER">Retailer</option>
              </select>
            </Field>
            <TextField label="Company name" value={form.companyName} onChange={(v) => set("companyName", v)} />
            <TextField label="Trading name" value={form.tradingName ?? ""} onChange={(v) => set("tradingName", v || undefined)} />
            <TextField label="Country / HQ" value={form.country} onChange={(v) => set("country", v)} />
            <TextField label="HQ country" value={form.hqCountry ?? ""} onChange={(v) => set("hqCountry", v || undefined)} />
            <TextField label="HQ city" value={form.hqCity ?? ""} onChange={(v) => set("hqCity", v || undefined)} />
            <TextField label="Website" value={form.website ?? ""} onChange={(v) => set("website", v || undefined)} />
          </div>
          <ListField
            label="Operating countries"
            value={form.operatingCountries ?? []}
            onChange={(v) => set("operatingCountries", v)}
            placeholder="UAE, KSA, Qatar"
          />
          <CheckboxGroup
            label="Roles (select all that apply)"
            value={form.roles ?? []}
            onChange={(v) => set("roles", v)}
            options={[
              { value: "RETAILER", label: "Retailer" },
              { value: "IMPORTER_DISTRIBUTOR", label: "Importer & Distributor" },
            ]}
          />
        </section>

        {/* 03 Categories & portfolio */}
        <section className="space-y-3">
          <SectionTitle n="03" title="Categories & portfolio" />
          <ListField label="Categories" value={form.categories ?? []} onChange={(v) => set("categories", v)} placeholder="Snacks, Beverages" />
          <Field label="Portfolio info">
            <Textarea value={form.portfolioInfo ?? ""} onChange={(e) => set("portfolioInfo", e.target.value || undefined)} />
          </Field>
          <TextField label="Portfolio products" value={form.portfolioProducts ?? ""} onChange={(v) => set("portfolioProducts", v || undefined)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Private label">
              <select
                value={form.privateLabel ?? ""}
                onChange={(e) => set("privateLabel", e.target.value || undefined)}
                className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <TextField label="Private label name" value={form.privateLabelName ?? ""} onChange={(v) => set("privateLabelName", v || undefined)} />
            <TextField label="Private label categories" value={form.privateLabelCategories ?? ""} onChange={(v) => set("privateLabelCategories", v || undefined)} />
          </div>
          <PortfolioDocs enabled={loaded} />
        </section>

        {/* 04 Importer & distributor */}
        {isImporter && (
          <section className="space-y-3">
            <SectionTitle n="04" title="Importer & distributor profile" />
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
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <TextField label="Expansion products" value={form.expansionProducts ?? ""} onChange={(v) => set("expansionProducts", v || undefined)} />
          </section>
        )}

        {/* 05 Retailer */}
        {isRetailer && (
          <section className="space-y-3">
            <SectionTitle n="05" title="Retailer profile" />
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
                <option value="">—</option>
                <option value="office">Office</option>
                <option value="outsourced">Outsourced</option>
                <option value="subsidiary">Subsidiary</option>
              </select>
            </Field>
            <Field label="Retail supply">
              <select
                value={form.retailSupply ?? ""}
                onChange={(e) => set("retailSupply", e.target.value || undefined)}
                className="flex h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
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
          </section>
        )}

        {/* Sourcing needs */}
        <section className="space-y-3">
          <SectionTitle n="—" title="Sourcing needs" />
          <Field label="What are you sourcing?">
            <Textarea value={form.sourcingNeeds ?? ""} onChange={(e) => set("sourcingNeeds", e.target.value || undefined)} />
          </Field>
          <CheckboxGroup
            label="Target GCC markets"
            value={form.targetMarkets ?? []}
            onChange={(v) => set("targetMarkets", v as BuyerProfileInput["targetMarkets"])}
            options={GCC_MARKET_OPTIONS}
          />
        </section>

        {/* Contact */}
        <section className="space-y-3">
          <SectionTitle n="—" title="Decision-maker contact" />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" value={form.contactFullName} onChange={(v) => set("contactFullName", v)} />
            <TextField label="Title / position" value={form.contactTitle} onChange={(v) => set("contactTitle", v)} />
            <TextField label="Email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} />
            <TextField label="Phone" value={form.contactPhone ?? ""} onChange={(v) => set("contactPhone", v || undefined)} />
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
