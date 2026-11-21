import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchManufacturerPublicProfile, type OpportunityCardDto } from "../../lib/api";

type FactValue = string | string[] | boolean | null | undefined;

function Fact({ label, value }: { label: string; value?: FactValue }) {
  if (value == null) return null;
  if (typeof value === "boolean") value = value ? "Yes" : "No";
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
    if (Array.isArray(v)) return v.length > 0;
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

function OpportunityCardRow({ c }: { c: OpportunityCardDto }) {
  const facts: Array<[string, FactValue]> = [
    ["Territory", c.territory],
    ["Channels", c.channels?.length ? c.channels : undefined],
    ["Partner", c.partner],
    ["Objective", c.objective],
    ["MOQ", c.moq],
    ["Timing", c.timing],
    ["Valid until", c.validUntil],
  ];
  const shown = facts.filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0) && v !== "");
  return (
    <li className="rounded-2xl border border-brand-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-brand-ink">{c.title}</h3>
        <span className="shrink-0 rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-[11px] font-medium text-brand-teal">
          Posted
        </span>
      </div>
      {c.summary && <p className="mt-1.5 text-sm leading-relaxed text-brand-muted">{c.summary}</p>}
      {shown.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {shown.map(([label, value]) => (
            <Fact key={label} label={label} value={value} />
          ))}
        </dl>
      )}
    </li>
  );
}

export default function ManufacturerPublicProfile() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["manufacturer-public", accountId],
    queryFn: () => fetchManufacturerPublicProfile(accountId!),
    enabled: Boolean(accountId),
  });

  if (isLoading) return <p className="p-6 text-sm text-brand-muted">Loading…</p>;
  if (isError || !data)
    return <p className="p-6 text-sm text-red-600">{(error as Error)?.message ?? "Profile not found."}</p>;

  const highlights = [
    data.industryCategory,
    data.targetExportMarket,
    data.productCategory,
    ...(data.salesChannels ?? []),
    ...(data.certs ?? []),
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
            ["Industry / category", data.industryCategory],
            ["Product category", data.productCategory],
            ["Country", data.country],
            ["Website", data.website],
            ["Annual revenue", data.annualRevenue],
            ["Annual revenue (other)", data.annualRevenueCustom],
            ["Years in business", data.yearsInBusiness],
            ["Current export markets", data.currentExportMarkets],
            ["Company info", data.companyInfo],
          ]}
        />
      </Section>

      {/* Products & operations */}
      <Section title="Products & operations">
        <FactGrid
          facts={[
            ["Halal certified", data.halalCert],
            ["SFDA status", data.sfdaStatus],
            ["Shelf life", data.shelfLife],
            ["Frozen storage", data.frozenStorage],
            ["Other certifications", data.otherCerts?.length ? data.otherCerts : undefined],
            ["Other certifications (other)", data.otherCertsCustom],
            ["Label languages", data.labelLanguages],
            ["Product adaptability", data.productAdaptability],
            ["Brand approach", data.brandApproach],
            ["Lead times", data.leadTimes],
            ["Logistics", data.logistics],
            ["Pictures", data.pictures],
            ["Branding", data.branding],
            ["Private label", data.privateLabel],
            ["Certifications", data.certs?.length ? data.certs : undefined],
          ]}
        />
      </Section>

      {/* Target market */}
      <Section title="Target market">
        <FactGrid
          facts={[
            ["Active in GCC", data.gccCurrentlyActive],
            ["Current GCC markets", data.currentGccMarkets?.length ? data.currentGccMarkets : undefined],
            ["GCC situation", data.gccSituation],
            ["Target market potential", data.targetMarketPotential],
            ["Target market potential (other)", data.targetMarketPotentialOther],
            ["Target export market", data.targetExportMarket],
            ["Sales channels", data.salesChannels?.length ? data.salesChannels : undefined],
            ["Channel strategy", data.channelStrategy],
            ["Top markets", data.topMarkets],
            ["Export count", data.exportCount != null ? String(data.exportCount) : undefined],
          ]}
        />
      </Section>

      {/* Operational readiness */}
      <Section title="Operational readiness">
        <FactGrid
          facts={[
            ["MOQ", data.moq],
            ["Production capacity", data.productionCapacity],
            ["Export contact", data.exportContact],
            ["Export contact details", data.exportContactDetails],
            ["Anything else", data.anythingElse],
          ]}
        />
      </Section>

      {/* Known for / USP */}
      {(data.knownFor || data.usp) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.knownFor && (
            <Section title="Known for">
              <p className="text-sm leading-relaxed text-brand-muted">{data.knownFor}</p>
            </Section>
          )}
          {data.usp && (
            <Section title="What sets them apart">
              <p className="text-sm leading-relaxed text-brand-muted">{data.usp}</p>
            </Section>
          )}
        </div>
      )}

      {/* About */}
      {data.publicDescription && (
        <Section title="About">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{data.publicDescription}</p>
        </Section>
      )}

      {/* Contacts */}
      {(data.contactFullName ||
        data.contactEmail ||
        data.contacts?.length) && (
        <Section title="Contacts">
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

      {/* Posted opportunities */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-ink">
          Posted opportunities{data.postedCards.length > 0 ? ` (${data.postedCards.length})` : ""}
        </h2>
        {data.postedCards.length === 0 ? (
          <p className="text-sm text-brand-muted">No published opportunities yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.postedCards.map((c) => (
              <OpportunityCardRow key={c.id} c={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
