import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@mea/shared";
import { fetchSubmission, fetchFileUrl } from "../../lib/api";
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

async function downloadFile(fileId: string) {
  const { url } = await fetchFileUrl(fileId);
  window.open(url, "_blank", "noopener");
}

export default function AdminDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery<SubmissionDto>({
    queryKey: ["submission", id],
    queryFn: () => fetchSubmission(id!),
    enabled: !!id,
  });



  return (
    <AdminLayout>
      <div className="flex items-center mb-4">
        <Link to="/admin" className="mr-4 text-sm text-mid-blue hover:underline">
          ← Back to submissions
        </Link>
        {data && (
          <button
            onClick={() => {
              // TODO: implement evaluate functionality
              alert('Evaluate functionality not implemented yet');
            }}
            className="ml-4 text-sm text-mid-blue hover:underline"
          >
            Evaluate
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load submission.</p>}

      {data && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-dark-blue">{data.companyName}</h1>
            <p className="text-sm text-gray-500">
              Received {new Date(data.createdAt).toLocaleString()}
            </p>
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
                          className="text-mid-blue hover:underline"
                        >
                          {f.originalName}
                        </button>
                        <span className="ml-2 text-xs text-gray-400">
                          ({(f.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              }
            />
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
        </>
      )}
    </AdminLayout>
  );
}
