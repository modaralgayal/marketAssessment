import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  REVENUE_OPTIONS,
  YES_NO_UNSURE_OPTIONS,
  OTHER_CERT_OPTIONS,
  TARGET_MARKET_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  TIMELINE_OPTIONS,
  CAPACITY_OPTIONS,
  SFDA_OPTIONS,
  ADAPTABILITY_OPTIONS,
  BUDGET_OPTIONS,
  HORIZON_OPTIONS,
  ACTIVATION_OPTIONS,
  type CustomerDto,
} from "@mea/shared";
import { fetchCustomer, deleteCustomer } from "../../lib/api";
import AdminLayout from "./AdminLayout";

type Opt = ReadonlyArray<{ value: string; label: string }>;
const label = (opts: Opt, value?: string | null) =>
  value ? (opts.find((o) => o.value === value)?.label ?? value) : "—";
const labels = (opts: Opt, values?: string[]) =>
  values && values.length ? values.map((v) => label(opts, v)).join(", ") : "—";
const yesNo = (v?: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");
const text = (v?: string | null) => (v && v.trim() ? v : "—");

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

function statusBadge(status: string) {
  switch (status) {
    case "QUALIFYING": return "bg-amber-100 text-amber-800";
    case "ACTIVE": return "bg-green-100 text-green-800";
    case "INACTIVE": return "bg-gray-100 text-brand-muted";
    case "WON": return "bg-blue-100 text-blue-800";
    case "LOST": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-brand-ink";
  }
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { data, isLoading, error } = useQuery<CustomerDto>({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!id || !data) return;
    if (!confirm(`Delete "${data.companyName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCustomer(id);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate("/admin/customers");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex items-center justify-between">
        {/* Back link */}
        <Link to="/admin/customers" className="text-sm text-brand-teal hover:underline">
          ← Back to customers
        </Link>

        {/* Three-dot dropdown for actions (top-right) */}
        {data && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded border border-brand-line bg-white px-3 py-2 text-sm text-brand-muted hover:bg-brand-bg-alt"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-brand-line bg-white py-1 shadow-lg">
                  <Link
                    to={`/admin/customers/${id}/edit`}
                    className="block px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg-alt"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    disabled={deleting}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load customer.</p>}

      {data && (
        <>
          <div className="mb-6 flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-brand-ink">{data.companyName}</h1>
              <p className="text-sm text-brand-muted">
                Onboarded {new Date(data.onboardingDate).toLocaleDateString()}
              </p>
            </div>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusBadge(data.customerStatus)}`}>
              {data.customerStatus}
            </span>
          </div>

          <Section title="1 · Company Profile">
            <Row label="Company Name" value={text(data.companyName)} />
            <Row label="Country" value={text(data.country)} />
            <Row label="Website" value={text(data.website)} />
            <Row label="Industry / Category" value={text(data.industryCategory)} />
            <Row label="Annual Revenue" value={label(REVENUE_OPTIONS, data.annualRevenue)} />
            <Row label="Years in Business" value={text(data.yearsInBusiness)} />
            <Row label="Current Export Markets" value={text(data.currentExportMarkets)} />
          </Section>

          <Section title="2 · Product">
            <Row label="Product Name(s)" value={text(data.productNames)} />
            <Row label="Number of SKUs" value={text(data.numberOfSkus)} />
            <Row label="Shelf Life" value={text(data.shelfLife)} />
            <Row label="Ex-Works Price Range" value={text(data.exWorksPriceRange)} />
            <Row label="Halal Certification" value={label(YES_NO_UNSURE_OPTIONS, data.halalCert)} />
            <Row label="Other Certifications" value={labels(OTHER_CERT_OPTIONS, data.otherCerts)} />
            <Row label="Label Languages" value={text(data.labelLanguages)} />
          </Section>

          <Section title="3 · GCC Ambitions">
            <Row label="Target Markets" value={labels(TARGET_MARKET_OPTIONS, data.targetMarkets)} />
            <Row label="Sales Channels" value={labels(SALES_CHANNEL_OPTIONS, data.salesChannels)} />
            <Row label="Timeline for First Sale" value={label(TIMELINE_OPTIONS, data.timeline)} />
            <Row label="Revenue Target — Year 1" value={text(data.revenueYear1Target)} />
            <Row label="Revenue Target — Year 3" value={text(data.revenueYear3Target)} />
            <Row label="Prior GCC Buyer Contact" value={yesNo(data.gccContact)} />
            <Row label="— Details" value={text(data.gccContactDetails)} />
            <Row label="Distribution Partner" value={yesNo(data.distributionPartner)} />
            <Row label="— Details" value={text(data.distributionDetails)} />
          </Section>

          <Section title="4 · Operational Readiness">
            <Row label="Minimum Order Quantity" value={text(data.moq)} />
            <Row label="Dedicated Export Contact" value={yesNo(data.exportContact)} />
            <Row label="Production Capacity" value={label(CAPACITY_OPTIONS, data.productionCapacity)} />
            <Row label="SFDA / ADAFSA Registration" value={label(SFDA_OPTIONS, data.sfdaStatus)} />
          </Section>

          <Section title="5 · Flexibility & Commitment">
            <Row label="Product Adaptability" value={label(ADAPTABILITY_OPTIONS, data.productAdaptability)} />
            <Row label="Budget Allocated" value={label(BUDGET_OPTIONS, data.budget)} />
            <Row label="Partnership Horizon" value={label(HORIZON_OPTIONS, data.partnershipHorizon)} />
            <Row label="Brand Activation Support" value={label(ACTIVATION_OPTIONS, data.brandActivation)} />
          </Section>

          <Section title="6 · Decision-Maker Contact">
            <Row label="Full Name" value={text(data.contactFullName)} />
            <Row label="Title / Position" value={text(data.contactTitle)} />
            <Row label="Email" value={text(data.contactEmail)} />
            <Row label="Phone" value={text(data.contactPhone)} />
            <Row label="Has Signing Authority" value={yesNo(data.hasSigningAuthority)} />
            <Row label="Signing Authority Contact" value={text(data.signingAuthorityContact)} />
            <Row label="Anything Else" value={text(data.anythingElse)} />
          </Section>

          <Section title="Status & Notes">
            <Row label="Customer Status" value={text(data.customerStatus)} />
            <Row label="Onboarding Date" value={new Date(data.onboardingDate).toLocaleDateString()} />
            <Row label="Notes" value={text(data.notes)} />
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
