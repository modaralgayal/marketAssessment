import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  type SubmissionDto,
  type ManufacturerMatchDto,
  type CustomerDto,
} from "@mea/shared";
import {
  fetchSubmission,
  fetchFileUrl,
  findMatches,
  fetchMatches,
  extractCatalogue,
  applyCatalogueMapping,
  convertSubmissionToCustomer,
  deleteCustomer,
  fetchCustomer,
  type ExtractCatalogueResponse,
} from "../../lib/api";
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

async function downloadFile(fileId: string) {
  const { url } = await fetchFileUrl(fileId);
  window.open(url, "_blank", "noopener");
}

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractCatalogueResponse | null>(null);
  const [applyingMapping, setApplyingMapping] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showCustomerActions, setShowCustomerActions] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const { data, isLoading, error } = useQuery<SubmissionDto>({
    queryKey: ["submission", id],
    queryFn: () => fetchSubmission(id!),
    enabled: !!id,
  });

  // Check if this submission has an associated customer
  const { data: customerData } = useQuery<CustomerDto>({
    queryKey: ["submission", id, "customer"],
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
    retry: false,
  });

  const { data: matches = [] } = useQuery<ManufacturerMatchDto[]>({
    queryKey: ["submission", id, "matches"],
    queryFn: () => fetchMatches(id!),
    enabled: !!id,
  });

  const handleFindMatches = async () => {
    if (!id) return;
    setMatching(true);
    setMatchError(null);
    try {
      await findMatches(id);
      await queryClient.invalidateQueries({ queryKey: ["submission", id] });
      await queryClient.invalidateQueries({ queryKey: ["submission", id, "matches"] });
      await queryClient.invalidateQueries({ queryKey: ["submission", id, "customer"] });
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Failed to find matches");
    } finally {
      setMatching(false);
    }
  };

  const handleExtractCatalogue = async () => {
    if (!id) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await extractCatalogue(id);
      setExtracted(result);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to extract catalogue data");
    } finally {
      setExtracting(false);
    }
  };

  const handleApplyMapping = async () => {
    if (!id || !extracted) return;
    setApplyingMapping(true);
    try {
      const additionalFields = extracted.fieldMapping.additional.map((f) => ({
        key: f.key,
        value: f.value,
      }));
      await applyCatalogueMapping(id, additionalFields);
      await queryClient.invalidateQueries({ queryKey: ["submission", id] });
      setExtracted(null);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to apply mapping");
    } finally {
      setApplyingMapping(false);
    }
  };

  // Check if current submission has an associated customer
  const isCustomerRecord = customerData != null;

  const handleConvertToCustomer = async () => {
    if (!id) return;
    setConverting(true);
    try {
      await convertSubmissionToCustomer(id);
      alert("Customer created successfully! You can view them in the Customers tab.");
      // Redirect to customers list
      window.location.href = "/admin/customers";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to convert submission to customer");
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!isCustomerRecord || !customerData) return;
    if (!confirm("Are you sure you want to delete this customer profile? This action cannot be undone.")) return;

    try {
      setDeletingCustomer(true);
      await deleteCustomer(customerData.id);
      alert("Customer profile deleted successfully.");
      // Redirect back to submissions
      window.location.href = "/admin";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete customer profile");
    } finally {
      setDeletingCustomer(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-700 bg-green-50";
    if (score >= 40) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  const matchLevelBadge = (level: string) => {
    switch (level) {
      case "STRONG": return "bg-green-100 text-green-800";
      case "MODERATE": return "bg-amber-100 text-amber-800";
      case "WEAK": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-brand-ink";
    }
  };

  return (
    <AdminLayout>
      {isLoading && <p className="text-sm text-brand-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load submission.</p>}

      {data && (
        <>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Link to="/admin" className="mr-4 text-sm text-brand-teal hover:underline">
                ← Back to submissions
              </Link>
              <h1 className="text-2xl font-bold text-brand-ink">{data.companyName}</h1>
              <p className="text-sm text-brand-muted">
                Received {new Date(data.createdAt).toLocaleString()}
              </p>
            </div>
            {/* Three-dot dropdown for customer actions */}
            <div className="relative">
              <button
                onClick={() => setShowCustomerActions(!showCustomerActions)}
                className="rounded border border-brand-line bg-white px-3 py-2 text-sm text-brand-muted hover:bg-brand-bg-alt"
              >
                ⋮
              </button>
              {showCustomerActions && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowCustomerActions(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-brand-line bg-white py-1 shadow-lg">
                    {!isCustomerRecord ? (
                      <button
                        onClick={handleConvertToCustomer}
                        disabled={converting}
                        className="flex w-full items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        {converting ? "Converting…" : "Turn into Customer"}
                      </button>
                    ) : (
                      <>
                        <Link
                          to={`/admin/customers/${customerData!.id}/edit`}
                          className="block px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg-alt"
                        >
                          Edit Customer Profile
                        </Link>
                        <button
                          onClick={handleDeleteCustomer}
                          disabled={deletingCustomer}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingCustomer ? "Deleting…" : "Delete Customer Profile"}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
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
            <Row
              label="Catalogue / Price List"
              value={
                data.files.length === 0 ? (
                  "—"
                ) : (
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
                )
              }
            />
            {data.files.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={handleExtractCatalogue}
                  disabled={extracting}
                  className="rounded-full border border-brand-teal px-3 py-1.5 text-xs font-semibold text-brand-teal transition-all duration-200 hover:bg-[#0F7B7F]/5 disabled:opacity-50"
                >
                  {extracting ? "Extracting catalogue data…" : "Extract Catalogue Data"}
                </button>
                {extractError && <p className="mt-1 text-xs text-red-600">{extractError}</p>}
              </div>
            )}
          </Section>

          {/* ── Extracted Catalogue Data ── */}
          {extracted && (
            <Section title="Extracted Catalogue Data — Review">
              <p className="mb-4 text-xs text-brand-muted">
                Review the data extracted from your catalogue files. Fields matching the assessment form are auto-mapped below.
              </p>

              {/* Auto-mapped fields */}
              {extracted.fieldMapping.matched.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-bold text-green-700">✓ Auto-mapped Fields</h3>
                  <div className="space-y-1">
                    {extracted.fieldMapping.matched.map((f) => (
                      <div key={f.key} className="flex items-center gap-2 rounded bg-green-50 px-3 py-1.5 text-sm">
                        <span className="font-medium text-green-800">{f.label}</span>
                        <span className="text-xs text-green-600">
                          → maps to {f.mapsTo.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional data fields */}
              {extracted.fieldMapping.additional.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-bold text-amber-700">Additional Data</h3>
                  <div className="space-y-2">
                    {extracted.fieldMapping.additional.map((f) => (
                      <div key={f.key} className="flex items-center gap-3 rounded border border-brand-line bg-amber-50/30 px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-brand-ink">{f.label}</div>
                          <div className="text-xs text-brand-muted">{f.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleApplyMapping}
                  disabled={applyingMapping}
                  className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md hover:-translate-y-px active:scale-[0.98] disabled:opacity-50"
                >
                  {applyingMapping ? "Applying…" : "Apply Mapping"}
                </button>
                <button
                  onClick={() => setExtracted(null)}
                  className="rounded border border-brand-line px-4 py-2 text-sm text-brand-muted hover:bg-brand-bg-alt"
                >
                  Cancel
                </button>
              </div>
            </Section>
          )}

          {/* ── Already-extracted data (read-only) ── */}
          {!extracted && data.catalogueData && data.catalogueExtractedAt && (
            <Section title="Extracted Catalogue Data">
              <p className="mb-4 text-xs text-brand-muted">
                Last extracted: {new Date(data.catalogueExtractedAt).toLocaleString()}
              </p>

              {/* Show additional data */}
              {data.catalogueData.additionalFields && data.catalogueData.additionalFields.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-bold text-brand-ink">Additional Data</h3>
                  <div className="space-y-2">
                    {data.catalogueData.additionalFields.map((f) => (
                      <div key={f.key} className="flex items-center gap-3 rounded border border-brand-line px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-brand-ink">{f.key}</div>
                          <div className="text-xs text-brand-muted">{f.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.files.length > 0 && (
                <button
                  onClick={handleExtractCatalogue}
                  disabled={extracting}
                  className="rounded border border-brand-teal px-3 py-1.5 text-xs font-semibold text-brand-teal hover:bg-[#0F7B7F]/5 disabled:opacity-50"
                >
                  {extracting ? "Extracting…" : "Re-extract"}
                </button>
              )}
            </Section>
          )}

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

          {/* ── Distributor Matches ── */}
          <Section title="Distributor Matches">
            <div className="mb-4">
              <button
                onClick={handleFindMatches}
                disabled={matching}
                className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md hover:-translate-y-px active:scale-[0.98] disabled:opacity-50"
              >
                {matching ? "Finding matches…" : "Find Matches"}
              </button>
              {matchError && <p className="mt-2 text-sm text-red-600">{matchError}</p>}
            </div>

            {matches.length === 0 ? (
              <p className="text-sm text-brand-muted">No matches yet. Click "Find Matches" to run the matching engine.</p>
            ) : (
              <div className="space-y-3">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-start gap-4 rounded-lg border border-brand-line bg-brand-bg-alt p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/distributors/${m.distributor.id}`}
                          className="font-semibold text-brand-ink hover:text-brand-teal hover:underline"
                        >
                          {m.distributor.companyName}
                        </Link>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          m.distributor.dataTier === 1 ? "bg-green-100 text-green-800" : m.distributor.dataTier === 2 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-brand-muted"
                        }`}>
                          T{m.distributor.dataTier}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${matchLevelBadge(m.matchLevel)}`}>
                          {m.matchLevel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-brand-muted">
                        {m.distributor.cityRegion} · {m.distributor.channelType}
                        {m.distributor.sizeScale && ` · ${m.distributor.sizeScale}`}
                      </p>
                      <p className="mt-2 text-sm text-brand-ink">{m.rationale}</p>
                      {m.distributor.contactPerson && (
                        <p className="mt-1 text-xs text-brand-muted">
                          Contact: {m.distributor.contactPerson}
                          {m.distributor.email && ` · ${m.distributor.email}`}
                        </p>
                      )}
                    </div>
                    <div className={`rounded-lg px-3 py-2 text-center text-sm font-bold ${scoreColor(m.compatibilityScore)}`}>
                      {m.compatibilityScore.toFixed(0)}
                      <div className="text-[10px] font-normal">Match</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </AdminLayout>
  );
}
