import { useState, useEffect } from "react";
import type { ReactNode } from "react";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-brand-line py-2.5 sm:grid-cols-[260px_1fr]">
      <div className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</div>
      <div className="text-sm text-brand-ink">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="border-b border-brand-line pb-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  CUSTOMER: "Customers",
  POTENTIAL: "Potential Customers",
  OTHER: "Other",
};

const categoryVariant: Record<string, "default" | "amber" | "muted"> = {
  CUSTOMER: "default",
  POTENTIAL: "amber",
  OTHER: "muted",
};

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
        <Link to="/admin/customers" className="text-sm text-brand-teal hover:underline">
          ← Back to customers
        </Link>

        {data && (
          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowMenu(!showMenu)}>
              ⋮
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-brand-line bg-white py-1 shadow-lg">
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
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
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
          <Card className="overflow-hidden">
            <div className="h-28 w-full bg-gradient-to-r from-brand-teal/25 via-brand-teal/10 to-brand-bg-alt sm:h-32" />
            <div className="px-6 pb-6">
              <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
                <Avatar className="h-24 w-24 border-4 border-white shadow-sm sm:h-28 sm:w-28">
                  {data.logoFileId && logoUrl ? (
                    <AvatarImage src={logoUrl} alt={`${data.companyName} logo`} />
                  ) : (
                    <AvatarFallback className="text-xl">{initials(data.companyName)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="min-w-0 flex-1 pb-1">
                  <h1 className="truncate text-2xl font-bold text-brand-ink">{data.companyName}</h1>
                  <p className="mt-0.5 truncate text-sm text-brand-muted">
                    {[text(data.country), data.productCategory || data.industryCategory]
                      .filter(Boolean)
                      .join("  ·  ") || "—"}
                  </p>
                </div>
                <Badge
                  variant={categoryVariant[data.category] ?? "default"}
                  className="mb-1 self-start"
                >
                  {CATEGORY_LABELS[data.category] ?? data.category}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-brand-muted">
                Onboarded {new Date(data.onboardingDate).toLocaleDateString()}
              </p>
            </div>
          </Card>

          <div className="mt-6 space-y-6">
            <Panel title="1 · Company Profile">
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
            </Panel>

            <Panel title="2 · Products and Operations">
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
            </Panel>

            <Panel title="3 · Target Market">
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
            </Panel>

            <Panel title="4 · Operational Readiness">
              <Row label="Minimum Order Quantity" value={text(data.moq)} />
              <Row label="Dedicated Export Contact" value={yesNo(data.exportContact)} />
              <Row label="Production Capacity" value={label(CAPACITY_OPTIONS, data.productionCapacity)} />
            </Panel>

            <Panel title="5 · Flexibility & Branding">
              <Row label="Product Adaptability" value={label(ADAPTABILITY_OPTIONS, data.productAdaptability)} />
              <Row label="Branding & Promotional Approach" value={label(BRAND_APPROACH_OPTIONS, data.brandApproach)} />
            </Panel>

            {/* ── Contact people (avatar cards; falls back to legacy fields) ── */}
            <Panel title="Contact people">
              {data.contacts && data.contacts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.contacts.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-brand-line bg-brand-bg-alt p-3"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{initials(c.name)}</AvatarFallback>
                      </Avatar>
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
            </Panel>

            <Panel title="Notes & Details">
              <Row label="Category" value={CATEGORY_LABELS[data.category] ?? data.category} />
              <Row label="Onboarding Date" value={new Date(data.onboardingDate).toLocaleDateString()} />
              <Row label="Notes" value={text(data.notes)} />
            </Panel>

            <Panel title="Files">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { url } = await fetchCustomerFileUrl(f.id);
                            window.open(url, "_blank", "noopener");
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Failed to get download link");
                          }
                        }}
                      >
                        Download
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brand-muted">No files uploaded.</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
