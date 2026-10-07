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
