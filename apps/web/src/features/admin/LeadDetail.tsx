import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchLead, fetchLeadFileUrl } from "../../lib/api";
import type { LeadDto } from "@mea/shared";
import AdminLayout from "./AdminLayout";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-brand-line py-2.5 sm:grid-cols-[260px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</div>
      <div className="text-sm text-brand-ink">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-brand-line bg-white p-6">
      <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">{title}</h2>
      {children}
    </section>
  );
}

const text = (v?: string | null) => (v && v.trim() ? v : "—");
const list = (v?: string[]) => (v && v.length ? v.join(", ") : "—");

async function downloadFile(fileId: string) {
  const { url } = await fetchLeadFileUrl(fileId);
  window.open(url, "_blank", "noopener");
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<LeadDto>({
    queryKey: ["lead", id],
    queryFn: () => fetchLead(id!),
    enabled: !!id,
  });

  return (
    <AdminLayout>
      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load lead.</p>}

      {data && (
        <>
          <div className="mb-6">
            <Link to="/admin/leads" className="mr-4 text-sm text-brand-teal hover:underline">
              ← Back to leads
            </Link>
            <span className="mr-3 rounded-full bg-brand-teal/15 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-teal">
              {data.kind}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-brand-ink">
              {data.companyName || data.organizationName || data.fullName || "Lead"}
            </h1>
            <p className="text-sm text-brand-muted">
              Received {new Date(data.createdAt).toLocaleString()}
              {data.sourcePage ? ` · via ${data.sourcePage}` : ""}
            </p>
          </div>

          <Section title="Contact">
            <Row label="Full name" value={text(data.fullName)} />
            <Row label="Email" value={text(data.email)} />
            <Row label="Phone" value={text(data.phone)} />
            <Row label="Job title" value={text(data.jobTitle)} />
            <Row
              label="Consent captured"
              value={data.consent ? "Yes (GDPR consent given)" : "No"}
            />
          </Section>

          {data.kind !== "ORGANIZATION" && (
            <Section title="Company & Market">
              <Row label="Company name" value={text(data.companyName)} />
              <Row label="Country" value={text(data.country)} />
              <Row label="Website" value={text(data.website)} />
              {data.kind === "EXPORTING" && (
                <>
                  <Row label="Product" value={text(data.product)} />
                  <Row label="Target export markets" value={list(data.targetMarket)} />
                </>
              )}
              {data.kind === "SOURCING" && (
                <>
                  <Row label="Products to source" value={text(data.products)} />
                  <Row label="Countries to source from" value={list(data.sourceCountries)} />
                  <Row label="Details" value={text(data.details)} />
                </>
              )}
            </Section>
          )}

          {data.kind === "ORGANIZATION" && (
            <Section title="Organization">
              <Row label="Organization name" value={text(data.organizationName)} />
              <Row label="Organization type" value={text(data.organizationType)} />
              <Row label="Country" value={text(data.country)} />
              <Row label="Support requested" value={list(data.support)} />
              <Row label="Priorities" value={text(data.priorities)} />
            </Section>
          )}

          {data.files.length > 0 && (
            <Section title="Attached documents">
              <ul className="space-y-1">
                {data.files.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => downloadFile(f.id)}
                      className="text-brand-teal hover:underline"
                    >
                      {f.originalName}
                    </button>
                    <span className="ml-2 text-xs text-brand-muted">
                      ({(f.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </li>
                ))}
              </ul>
              {data.productDocumentLink && (
                <a
                  href={data.productDocumentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-brand-teal hover:underline"
                >
                  Or view linked product document ↗
                </a>
              )}
            </Section>
          )}

          {data.productDocumentLink && data.files.length === 0 && (
            <Section title="Attached documents">
              <a
                href={data.productDocumentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-teal hover:underline"
              >
                View linked product document ↗
              </a>
            </Section>
          )}
        </>
      )}
    </AdminLayout>
  );
}
