import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDistributor, deleteDistributor } from "../../lib/api";
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

export default function DistributorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["distributor", id],
    queryFn: () => fetchDistributor(id!),
    enabled: !!id,
  });

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-dark-blue">{data.companyName}</h1>
            <p className="text-sm text-gray-500">
              Added {new Date(data.createdAt).toLocaleDateString()}
            </p>
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
        </>
      )}
    </AdminLayout>
  );
}