import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBuyerPublicProfile } from "../../lib/api";

type FactValue = string | string[] | number | boolean | Record<string, unknown> | null | undefined;

function Fact({ label, value }: { label: string; value?: FactValue }) {
  if (value == null) return null;
  if (typeof value === "boolean") value = value ? "Yes" : "No";
  if (typeof value === "number") value = String(value);
  if (typeof value === "object" && !Array.isArray(value)) value = JSON.stringify(value);
  if (Array.isArray(value) && value.length === 0) return null;
  const text = Array.isArray(value) ? value.join(", ") : value;
  if (text === "") return null;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-brand-ink">{text}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-brand-ink">{title}</h2>
      {children}
    </div>
  );
}

function FactGrid({ facts }: { facts: Array<[string, FactValue]> }) {
  const shown = facts.filter(([, v]) => {
    if (v == null) return false;
    if (typeof v === "boolean") return true;
    if (typeof v === "number") return true;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return v !== "";
  });
  if (shown.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {shown.map(([label, value]) => (
        <Fact key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

function pretty(v?: string | null) {
  return v ? v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

export default function BuyerPublicProfile() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["buyer-public", accountId],
    queryFn: () => fetchBuyerPublicProfile(accountId!),
    enabled: Boolean(accountId),
  });

  if (isLoading) return <p className="p-6 text-sm text-brand-muted">Loading…</p>;
  if (isError || !data)
    return <p className="p-6 text-sm text-red-600">{(error as Error)?.message ?? "Profile not found."}</p>;

  const highlights = [
    pretty(data.buyerType),
    ...(data.categories ?? []),
    ...(data.channels ?? []),
    ...(data.targetMarkets ?? []),
  ].filter(Boolean) as string[];

  return (
    <div className="w-full space-y-5 p-6">
      <button onClick={() => navigate(-1)} className="text-xs font-medium text-brand-teal hover:underline">
        ← Back
      </button>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-brand-line bg-white">
        <div className="h-24 bg-gradient-to-r from-brand-teal/15 via-brand-teal/10 to-brand-bg-alt" />
        <div className="px-6 pb-6">
          <div className="-mt-16 flex items-end gap-4">
            <div className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-brand-bg-alt shadow-sm">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt={`${data.companyName} logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm text-brand-muted">No logo</span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-brand-ink">{data.companyName}</h1>
              <p className="mt-0.5 text-sm text-brand-muted">
                {[data.country, data.website ? `🌐 ${data.website}` : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-brand-bg-alt px-2.5 py-0.5 text-[11px] font-medium text-brand-ink"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company */}
      <Section title="Company">
        <FactGrid
          facts={[
            ["Buyer type", pretty(data.buyerType)],
            ["Trading name", data.tradingName],
            ["HQ country", data.hqCountry],
            ["HQ city", data.hqCity],
            ["Operating countries", data.operatingCountries?.length ? data.operatingCountries : undefined],
            ["Roles", data.roles?.length ? data.roles : undefined],
          ]}
        />
      </Section>

      {/* Categories & portfolio */}
      <Section title="Categories & portfolio">
        <FactGrid
          facts={[
            ["Categories", data.categories?.length ? data.categories : undefined],
            ["Portfolio info", data.portfolioInfo],
            ["Portfolio products", data.portfolioProducts],
            ["Private label", data.privateLabel],
            ["Private label name", data.privateLabelName],
            ["Private label categories", data.privateLabelCategories],
          ]}
        />
      </Section>

      {/* Sourcing needs */}
      <Section title="Sourcing needs">
        <FactGrid
          facts={[
            ["Sourcing needs", data.sourcingNeeds],
            ["Target markets", data.targetMarkets?.length ? data.targetMarkets : undefined],
          ]}
        />
      </Section>

      {/* Importer & distributor profile */}
      <Section title="Importer & distributor profile">
        <FactGrid
          facts={[
            ["Distribution role", data.distributionRole],
            ["Warehouse", data.warehouse],
            ["Warehouse arrangement", data.warehouseArrangement],
            ["Storage", data.storage?.length ? data.storage : undefined],
            ["Vehicles", data.vehicles],
            ["Vehicle arrangement", data.vehicleArrangement],
            ["Channels", data.channels?.length ? data.channels : undefined],
            ["Channel percentages", data.channelPercentages],
            ["Channel basis", data.channelBasis],
            ["Sales points", data.salesPoints],
            ["Sales reach mode", data.salesReachMode],
            ["Distribution geography", data.distributionGeography],
            ["Expand portfolio", data.expandPortfolio],
            ["Expansion products", data.expansionProducts],
            ["Distribution product type", data.distributionProductType],
          ]}
        />
      </Section>

      {/* Retailer profile */}
      <Section title="Retailer profile">
        <FactGrid
          facts={[
            ["Retail formats", data.retailFormats?.length ? data.retailFormats : undefined],
            ["Store count", data.storeCount],
            ["Retail geography", data.retailGeography],
            ["Purchasing structure", data.purchasingStructure],
            ["Purchasing office", data.purchasingOffice],
            ["Purchasing outsourced", data.purchasingOutsourced],
            ["Purchasing subsidiary", data.purchasingSubsidiary],
            ["Purchasing subsidiary name", data.purchasingSubsidiaryName],
            ["Retail supply", data.retailSupply],
            ["Direct import %", data.directImportPercent],
            ["Local supplier %", data.localSupplierPercent],
            ["Retail mix basis", data.retailMixBasis],
            ["Assortment plan", data.assortmentPlan],
            ["Retail expansion products", data.retailExpansionProducts],
            ["Retail product type", data.retailProductType],
            ["Retail delivery", data.retailDelivery],
            ["Details", data.details],
          ]}
        />
      </Section>

      {/* Contact */}
      {(data.contactFullName || data.contactEmail || data.contacts?.length) && (
        <Section title="Contact">
          <FactGrid
            facts={[
              ["Primary contact", data.contactFullName],
              ["Title", data.contactTitle],
              ["Email", data.contactEmail],
              ["Phone", data.contactPhone],
            ]}
          />
          {data.contacts?.length ? (
            <ul className="mt-4 space-y-2">
              {data.contacts.map((c, i) => (
                <li key={i} className="rounded-xl border border-brand-line bg-brand-bg-alt/50 p-3 text-sm">
                  <p className="font-medium text-brand-ink">{c.name}</p>
                  {c.position && <p className="text-brand-muted">{c.position}</p>}
                  {(c.email || c.phone) && (
                    <p className="mt-0.5 text-xs text-brand-muted">
                      {[c.email, c.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </Section>
      )}

      {/* About */}
      {data.publicDescription && (
        <Section title="About">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{data.publicDescription}</p>
        </Section>
      )}
    </div>
  );
}
