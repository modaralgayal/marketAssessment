import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchManufacturerPublicProfile, type OpportunityCardDto } from "../../lib/api";

function Fact({ label, value }: { label: string; value?: string | string[] | null }) {
  if (value == null || (Array.isArray(value) && value.length === 0)) return null;
  const text = Array.isArray(value) ? value.join(", ") : value;
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-brand-ink">{text}</dd>
    </div>
  );
}

function OpportunityCardRow({ c }: { c: OpportunityCardDto }) {
  const facts: Array<[string, string | string[] | null | undefined]> = [
    ["Territory", c.territory],
    ["Channels", c.channels?.length ? c.channels : undefined],
    ["Partner", c.partner],
    ["Objective", c.objective],
    ["MOQ", c.moq],
    ["Timing", c.timing],
    ["Valid until", c.validUntil],
  ];
  const shown = facts.filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0));
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

      {/* Known for / USP */}
      {(data.knownFor || data.usp) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.knownFor && (
            <div className="rounded-2xl border border-brand-line bg-white p-5">
              <h2 className="mb-1 text-sm font-semibold text-brand-ink">Known for</h2>
              <p className="text-sm leading-relaxed text-brand-muted">{data.knownFor}</p>
            </div>
          )}
          {data.usp && (
            <div className="rounded-2xl border border-brand-line bg-white p-5">
              <h2 className="mb-1 text-sm font-semibold text-brand-ink">What sets them apart</h2>
              <p className="text-sm leading-relaxed text-brand-muted">{data.usp}</p>
            </div>
          )}
        </div>
      )}

      {/* About */}
      {data.publicDescription && (
        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-brand-ink">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{data.publicDescription}</p>
        </div>
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
