import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { fetchBuyerProfile, upsertBuyerProfile, type BuyerProfileInput } from "../../lib/api";
import { GCC_MARKET_OPTIONS } from "@mea/shared";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
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

  if (isLoading && !loaded) return <p className="text-sm text-brand-muted">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buyer profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Your business</h4>
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
            <Field label="Company name">
              <Input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </Field>
            <Field label="Website">
              <Input
                value={form.website ?? ""}
                onChange={(e) => set("website", e.target.value || undefined)}
              />
            </Field>
          </div>
          <Field label="Categories & portfolio">
            <Textarea
              value={form.portfolioInfo ?? ""}
              onChange={(e) => set("portfolioInfo", e.target.value || undefined)}
              placeholder="What categories do you buy / represent?"
            />
          </Field>
          <CheckboxGroup
            label="Target GCC markets"
            value={form.targetMarkets}
            onChange={(v) => set("targetMarkets", v as BuyerProfileInput["targetMarkets"])}
            options={GCC_MARKET_OPTIONS}
          />
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Sourcing needs</h4>
          <Field label="What are you sourcing?">
            <Textarea
              value={form.sourcingNeeds ?? ""}
              onChange={(e) => set("sourcingNeeds", e.target.value || undefined)}
              placeholder="Describe the products, volumes, and certifications you need."
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-brand-ink">Decision-maker contact</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.contactFullName} onChange={(e) => set("contactFullName", e.target.value)} />
            </Field>
            <Field label="Title / position">
              <Input value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input
                value={form.contactPhone ?? ""}
                onChange={(e) => set("contactPhone", e.target.value || undefined)}
              />
            </Field>
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
