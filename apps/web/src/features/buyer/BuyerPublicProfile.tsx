import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBuyerPublicProfile } from "../../lib/api";

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
    data.buyerType ? data.buyerType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : null,
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

      {/* Sourcing needs */}
      {data.sourcingNeeds && (
        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-brand-ink">Sourcing needs</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{data.sourcingNeeds}</p>
        </div>
      )}

      {/* About */}
      {data.publicDescription && (
        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-brand-ink">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-muted">{data.publicDescription}</p>
        </div>
      )}

      {/* Highlights */}
      <div className="rounded-2xl border border-brand-line bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-brand-ink">Highlights</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Fact label="Type" value={data.buyerType?.replace(/_/g, " ")} />
          <Fact label="Roles" value={data.roles} />
          <Fact label="Categories" value={data.categories} />
          <Fact label="Operating in" value={data.operatingCountries} />
          <Fact label="Target markets" value={data.targetMarkets} />
          <Fact label="Sales channels" value={data.channels} />
        </dl>
      </div>
    </div>
  );
}
