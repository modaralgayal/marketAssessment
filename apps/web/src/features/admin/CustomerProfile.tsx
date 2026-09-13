import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  type CustomerDto,
} from "@mea/shared";
import { fetchCustomer, deleteCustomer, fetchCustomerFileUrl, setCustomerCategory } from "../../lib/api";
import AdminLayout from "./AdminLayout";

type Opt = ReadonlyArray<{ value: string; label: string }>;
const label = (opts: Opt, value?: string | null) =>
  value ? (opts.find((o) => o.value === value)?.label ?? value) : "—";
const labels = (opts: Opt, values?: string[]) =>
  values && values.length ? values.map((v) => label(opts, v)).join(", ") : "—";
const yesNo = (v?: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");
const text = (v?: string | null) => (v && v.trim() ? v : "—");

const initials = (name?: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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

const CATEGORY_LABELS: Record<string, string> = {
  CUSTOMER: "Customers",
  POTENTIAL: "Potential Customers",
  OTHER: "Other",
};

function categoryBadge(category: string) {
  switch (category) {
    case "CUSTOMER": return "bg-brand-teal/15 text-brand-teal";
    case "POTENTIAL": return "bg-amber-100 text-amber-800";
    case "OTHER": return "bg-gray-100 text-brand-muted";
    default: return "bg-gray-100 text-brand-ink";
  }
}

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const MOVE_TARGETS = ["CUSTOMER", "POTENTIAL", "OTHER"] as const;
  type MoveTarget = (typeof MOVE_TARGETS)[number];

  const handleMove = async (target: MoveTarget) => {
    if (!id || !data || target === data.category) return;
    setShowMenu(false);
    setMoving(true);
    try {
      await setCustomerCategory(id, target);
      await queryClient.invalidateQueries({ queryKey: ["customer", id] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setMoving(false);
    }
  };

  const { data, isLoading, error } = useQuery<CustomerDto>({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  });

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (data?.logoFileId) {
      fetchCustomerFileUrl(data.logoFileId)
        .then((r) => active && setLogoUrl(r.url))
        .catch(() => active && setLogoUrl(null));
    } else {
      setLogoUrl(null);
    }
    return () => {
      active = false;
    };
  }, [data?.logoFileId]);

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
                  <div className="border-t border-brand-line px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                    Move to
                  </div>
                  {MOVE_TARGETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleMove(t)}
                      disabled={moving || t === data?.category}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg-alt disabled:opacity-40"
                    >
                      {CATEGORY_LABELS[t]}
                      {data?.category === t && <span className="text-brand-teal">●</span>}
                    </button>
                  ))}
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
          {/* ── Profile header (social-style) ── */}
          <section className="overflow-hidden rounded-xl border border-brand-line bg-white shadow-sm">
            <div className="h-28 w-full bg-gradient-to-r from-brand-teal/25 via-brand-teal/10 to-brand-bg-alt sm:h-32" />
            <div className="px-6 pb-6">
              <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-bg-alt text-xl font-bold text-brand-teal shadow-sm sm:h-28 sm:w-28">
                  {data.logoFileId && logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={`${data.companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(data.companyName)
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <h1 className="truncate text-2xl font-bold text-brand-ink">{data.companyName}</h1>
                  <p className="mt-0.5 truncate text-sm text-brand-muted">
                    {[text(data.country), data.productCategory || data.industryCategory]
                      .filter(Boolean)
                      .join("  ·  ") || "—"}
                  </p>
                </div>
                <span
                  className={`mb-1 inline-block flex-shrink-0 rounded-full px-3 py-1 text-xs font-bold ${categoryBadge(
                    data.category,
                  )}`}
                >
                  {CATEGORY_LABELS[data.category] ?? data.category}
                </span>
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Onboarded {new Date(data.onboardingDate).toLocaleDateString()}
              </p>
            </div>
          </section>

          <Section title="1 · Company Profile">
            <Row label="Company Name" value={text(data.companyName)} />
            <Row label="Country" value={text(data.country)} />
            <Row label="Website" value={text(data.website)} />
            <Row label="Industry / Category" value={text(data.industryCategory)} />
            <Row label="Annual Revenue" value={label(REVENUE_OPTIONS, data.annualRevenue)} />
            {data.annualRevenue === "CUSTOM" && (
              <Row label="— Revenue (specified)" value={text(data.annualRevenueCustom)} />
            )}
            <Row label="Years in Business" value={text(data.yearsInBusiness)} />
            <Row label="Current Export Markets" value={text(data.currentExportMarkets)} />
          </Section>

          <Section title="2 · Products and Operations">
            <Row label="Frozen Storage Required" value={label(FROZEN_STORAGE_OPTIONS, data.frozenStorage)} />
            <Row label="Shelf Life" value={label(SHELF_LIFE_OPTIONS, data.shelfLife)} />
            <Row label="Halal Certification" value={label(YES_NO_UNSURE_OPTIONS, data.halalCert)} />
            <Row label="SFDA / ADAFSA Status" value={label(SFDA_OPTIONS, data.sfdaStatus)} />
            <Row label="Other Certifications" value={labels(OTHER_CERT_OPTIONS, data.otherCerts)} />
            {data.otherCerts?.includes("CUSTOM") && (
              <Row label="— Other Certifications (specified)" value={text(data.otherCertsCustom)} />
            )}
            <Row label="Label Languages" value={text(data.labelLanguages)} />
            <Row label="Product Adaptability" value={label(ADAPTABILITY_OPTIONS, data.productAdaptability)} />
            <Row label="Branding & Promotional Approach" value={label(BRAND_APPROACH_OPTIONS, data.brandApproach)} />
            <Row label="Lead Times" value={text(data.leadTimes)} />
          </Section>

          <Section title="3 · Target Market">
            <Row label="Currently Active in GCC" value={yesNo(data.gccCurrentlyActive)} />
            {data.gccCurrentlyActive === true && (
              <>
                <Row label="Current GCC Markets" value={labels(GCC_MARKET_OPTIONS, data.currentGccMarkets)} />
                <Row label="Current GCC Situation" value={text(data.gccSituation)} />
              </>
            )}
            {data.gccCurrentlyActive === false && (
              <>
                <Row label="Target Market Potential" value={label(TARGET_POTENTIAL_OPTIONS, data.targetMarketPotential)} />
                {data.targetMarketPotential === "OTHER" && (
                  <Row label="— Other markets (specified)" value={text(data.targetMarketPotentialOther)} />
                )}
              </>
            )}
            <Row label="Sales Channels" value={labels(SALES_CHANNEL_OPTIONS, data.salesChannels)} />
            <Row label="Channel Strategy" value={text(data.channelStrategy)} />
          </Section>

          <Section title="4 · Operational Readiness">
            <Row label="Minimum Order Quantity" value={text(data.moq)} />
            <Row label="Dedicated Export Contact" value={yesNo(data.exportContact)} />
            <Row label="Production Capacity" value={label(CAPACITY_OPTIONS, data.productionCapacity)} />
          </Section>

          <Section title="5 · Flexibility & Branding">
            <Row label="Product Adaptability" value={label(ADAPTABILITY_OPTIONS, data.productAdaptability)} />
            <Row label="Branding & Promotional Approach" value={label(BRAND_APPROACH_OPTIONS, data.brandApproach)} />
          </Section>

          {/* ── Contact people (avatar cards; falls back to legacy fields) ── */}
          <Section title="Contact people">
            {data.contacts && data.contacts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.contacts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-brand-line bg-white p-3"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-base font-bold text-brand-teal">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-brand-ink">
                        {c.name || "—"}
                      </div>
                      {c.position ? (
                        <div className="truncate text-xs text-brand-muted">{c.position}</div>
                      ) : null}
                      <div className="truncate text-xs text-brand-muted">
                        {[c.email, c.phone].filter(Boolean).join("  ·  ") || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <Row label="Full Name" value={text(data.contactFullName)} />
                <Row label="Title / Position" value={text(data.contactTitle)} />
                <Row label="Email" value={text(data.contactEmail)} />
                <Row label="Phone" value={text(data.contactPhone)} />
                <Row label="Anything Else" value={text(data.anythingElse)} />
              </div>
            )}
          </Section>

          <Section title="Notes & Details">
            <Row label="Category" value={CATEGORY_LABELS[data.category] ?? data.category} />
            <Row label="Onboarding Date" value={new Date(data.onboardingDate).toLocaleDateString()} />
            <Row label="Notes" value={text(data.notes)} />
          </Section>

          <Section title="Files">
            {data.files && data.files.length > 0 ? (
              <ul className="divide-y divide-brand-line">
                {data.files.map((f) => (
                  <li key={f.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-brand-ink">{f.originalName}</p>
                      <p className="text-xs text-brand-muted">
                        {(f.sizeBytes / 1024).toFixed(0)} KB · {new Date(f.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const { url } = await fetchCustomerFileUrl(f.id);
                          window.open(url, "_blank", "noopener");
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Failed to get download link");
                        }
                      }}
                      className="ml-4 flex-shrink-0 rounded border border-brand-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-brand-bg-alt"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-muted">No files uploaded.</p>
            )}
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
