import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDistributor, deleteDistributor, fetchDataTierTemplate, recalcDistributorTier } from "../../lib/api";
import type { DataTierTemplate, DataTierField } from "@mea/shared";
import AdminLayout from "./AdminLayout";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border py-2.5 sm:grid-cols-[260px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-border bg-white p-6">
      <h2 className="mb-3 border-b-2 border-mid-blue pb-2 text-base font-bold text-dark-blue">{title}</h2>
      {children}
    </section>
  );
}

const text = (v?: string | null) => (v && v.trim() ? v : "—");

function TierBadge({ tier }: { tier: number }) {
  const colors: Record<number, string> = {
    1: "bg-green-100 text-green-800 border-green-300",
    2: "bg-amber-100 text-amber-800 border-amber-300",
    3: "bg-gray-100 text-gray-600 border-gray-300",
  };
  const labels: Record<number, string> = {
    1: "Tier 1 · Verified Relationship",
    2: "Tier 2 · Direct Contact",
    3: "Tier 3 · Public Information",
  };

  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${colors[tier] ?? colors[3]}`}>
      {labels[tier] ?? "Tier 3"}
    </span>
  );
}

function TierSection({ title, fields, attributes, tierNum }: { title: string; fields: DataTierField[]; attributes: Record<string, any>; tierNum: number }) {
  const filled = fields.filter((f) => {
    const v = attributes[f.key];
    return v !== undefined && v !== null && v !== "";
  }).length;

  if (filled === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-border bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-dark-blue">Tier {tierNum} · {title}</h3>
        <span className="text-xs text-gray-500">{filled}/{fields.length}</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${filled === fields.length ? "bg-green-500" : "bg-mid-blue"}`}
          style={{ width: `${(filled / fields.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {fields.map((f) => {
          const v = attributes[f.key];
          if (v === undefined || v === null || v === "") return null;
          return (
            <div key={f.key} className="text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{f.label}: </span>
              <span className="text-gray-800">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DistributorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [tierTemplate, setTierTemplate] = useState<DataTierTemplate | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["distributor", id],
    queryFn: () => fetchDistributor(id!),
    enabled: !!id,
  });

  useEffect(() => {
    fetchDataTierTemplate()
      .then(setTierTemplate)
      .catch(() => {});
  }, []);

  const handleRecalcTier = async () => {
    if (!id) return;
    setRecalculating(true);
    try {
      await recalcDistributorTier(id);
      await queryClient.invalidateQueries({ queryKey: ["distributor", id] });
    } catch (err) {
      alert("Failed to recalculate tier.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !data) return;
    if (!confirm(`Delete "${data.companyName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteDistributor(id);
      await queryClient.invalidateQueries({ queryKey: ["distributors"] });
      navigate("/admin/distributors");
    } catch (err) {
      alert("Failed to delete distributor.");
    } finally {
      setDeleting(false);
    }
  };

  const attrs = data?.attributes ?? {};

  // Find template keys for identifying ad-hoc fields
  const templateKeys = tierTemplate
    ? new Set([
        ...tierTemplate.tier1.fields.map((f) => f.key),
        ...tierTemplate.tier2.fields.map((f) => f.key),
        ...tierTemplate.tier3.fields.map((f) => f.key),
      ])
    : new Set<string>();

  const extraFields = Object.entries(attrs).filter(([k]) => !templateKeys.has(k) && typeof attrs[k] === "string" && attrs[k]?.toString().trim());

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/distributors" className="text-sm text-mid-blue hover:underline">
            ← Back to distributors
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/distributors/${id}/edit`}
            className="rounded bg-mid-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-dark-blue"
          >
            Edit
          </Link>
          <button
            onClick={handleRecalcTier}
            disabled={recalculating}
            className="rounded border border-gray-400 bg-white px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {recalculating ? "Recalculating…" : "Recalc Tier"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-red-500 px-4 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load distributor.</p>}

      {data && (
        <>
          <div className="mb-6 flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-dark-blue">{data.companyName}</h1>
              <p className="text-sm text-gray-500">
                Added {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
            <TierBadge tier={data.dataTier} />
          </div>

          <Section title="Contact & Location">
            <Row label="City / Region" value={text(data.cityRegion)} />
            <Row label="Channel / Type" value={text(data.channelType)} />
            <Row label="Size / Scale" value={text(data.sizeScale)} />
            <Row label="Website" value={text(data.website)} />
            <Row label="Phone" value={text(data.phone)} />
            <Row label="Email" value={text(data.email)} />
            <Row label="Contact Person" value={text(data.contactPerson)} />
          </Section>

          <Section title="Relationship">
            <Row label="Do We Know Them?" value={text(data.doWeKnowThem)} />
            <Row label="Status / Last Contact" value={text(data.statusLastContact)} />
            <Row label="Match Count" value={data.matchCount != null ? String(data.matchCount) : "—"} />
          </Section>

          {data.description && (
            <Section title="Description">
              <p className="text-sm whitespace-pre-wrap text-gray-700">{data.description}</p>
            </Section>
          )}

          {/* ── Tier Data Sections ── */}
          {tierTemplate && (
            <Section title="Data Quality Tiers">
              {data.dataTier > 1 && (
                <p className="mb-4 text-xs text-amber-600">
                  Fill in more fields to reach a higher data tier — better data means more accurate matches.
                </p>
              )}
              <TierSection
                title={tierTemplate.tier1.label}
                fields={tierTemplate.tier1.fields}
                attributes={attrs}
                tierNum={1}
              />
              <TierSection
                title={tierTemplate.tier2.label}
                fields={tierTemplate.tier2.fields}
                attributes={attrs}
                tierNum={2}
              />
              <TierSection
                title={tierTemplate.tier3.label}
                fields={tierTemplate.tier3.fields}
                attributes={attrs}
                tierNum={3}
              />
            </Section>
          )}

          {/* ── Ad-hoc Data ── */}
          {extraFields.length > 0 && (
            <Section title="Additional Data">
              {extraFields.map(([key, value]) => (
                <Row key={key} label={key} value={value} />
              ))}
            </Section>
          )}
        </>
      )}
    </AdminLayout>
  );
}