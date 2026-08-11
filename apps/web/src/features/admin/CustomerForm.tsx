import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  type CustomerInput,
  customerStatuses,
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
} from "@mea/shared";
import { fetchCustomer, createCustomer, updateCustomer } from "../../lib/api";
import AdminLayout from "./AdminLayout";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-brand-line bg-white p-6">
      <h2 className="mb-3 border-b-2 border-brand-teal pb-2 text-base font-bold text-brand-ink">{title}</h2>
      {children}
    </section>
  );
}

export default function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
  });

  // Load existing customer data
  useEffect(() => {
    if (isEdit && id) {
      fetchCustomer(id)
        .then((customer) => {
          reset({
            companyName: customer.companyName,
            country: customer.country,
            website: customer.website ?? undefined,
            industryCategory: customer.industryCategory,
            annualRevenue: customer.annualRevenue ?? undefined,
            yearsInBusiness: customer.yearsInBusiness ?? undefined,
            currentExportMarkets: customer.currentExportMarkets ?? undefined,
            productNames: customer.productNames,
            numberOfSkus: customer.numberOfSkus ?? undefined,
            shelfLife: customer.shelfLife ?? undefined,
            exWorksPriceRange: customer.exWorksPriceRange ?? undefined,
            halalCert: customer.halalCert ?? undefined,
            otherCerts: customer.otherCerts ?? [],
            labelLanguages: customer.labelLanguages ?? undefined,
            targetMarkets: customer.targetMarkets ?? [],
            salesChannels: customer.salesChannels ?? [],
            timeline: customer.timeline ?? undefined,
            revenueYear1Target: customer.revenueYear1Target ?? undefined,
            revenueYear3Target: customer.revenueYear3Target ?? undefined,
            gccContact: customer.gccContact ?? undefined,
            gccContactDetails: customer.gccContactDetails ?? undefined,
            distributionPartner: customer.distributionPartner ?? undefined,
            distributionDetails: customer.distributionDetails ?? undefined,
            moq: customer.moq ?? undefined,
            exportContact: customer.exportContact ?? undefined,
            productionCapacity: customer.productionCapacity ?? undefined,
            sfdaStatus: customer.sfdaStatus ?? undefined,
            productAdaptability: customer.productAdaptability ?? undefined,
            budget: customer.budget ?? undefined,
            partnershipHorizon: customer.partnershipHorizon ?? undefined,
            brandActivation: customer.brandActivation ?? undefined,
            contactFullName: customer.contactFullName,
            contactTitle: customer.contactTitle ?? undefined,
            contactEmail: customer.contactEmail,
            contactPhone: customer.contactPhone ?? undefined,
            hasSigningAuthority: customer.hasSigningAuthority ?? undefined,
            signingAuthorityContact: customer.signingAuthorityContact ?? undefined,
            anythingElse: customer.anythingElse ?? undefined,
            customerStatus: customer.customerStatus,
            notes: customer.notes ?? undefined,
            onboardingDate: customer.onboardingDate ? customer.onboardingDate.slice(0, 10) : undefined,
          });
        })
        .catch(() => setError("Failed to load customer"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data: CustomerInput) => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateCustomer(id, data);
      } else {
        await createCustomer(data);
      }
      navigate("/admin/customers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = customerStatuses.map((s) => ({ value: s, label: s }));

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-brand-muted">Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-ink">
          {isEdit ? "Edit Customer" : "Add Customer"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-brand-line bg-white p-6">
        {/* ── Section 1 - Company Profile ── */}
        <Section title="1 · Company Profile">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Company Name *
              </label>
              <input
                {...register("companyName")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Country *
              </label>
              <input
                {...register("country")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Website
              </label>
              <input
                {...register("website")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Industry / Category *
              </label>
              <input
                {...register("industryCategory")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.industryCategory && (
                <p className="mt-1 text-xs text-red-600">{errors.industryCategory.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Annual Revenue
              </label>
              <select
                {...register("annualRevenue")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {REVENUE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Years in Business
              </label>
              <input
                {...register("yearsInBusiness")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Current Export Markets
              </label>
              <input
                {...register("currentExportMarkets")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {/* ── Section 2 - Product ── */}
        <Section title="2 · Product">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Product Name(s) *
              </label>
              <input
                {...register("productNames")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.productNames && (
                <p className="mt-1 text-xs text-red-600">{errors.productNames.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Number of SKUs
              </label>
              <input
                {...register("numberOfSkus")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Shelf Life
              </label>
              <input
                {...register("shelfLife")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Ex-Works Price Range
              </label>
              <input
                {...register("exWorksPriceRange")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Halal Certification
              </label>
              <select
                {...register("halalCert")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {YES_NO_UNSURE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Other Certifications
              </label>
              <select
                {...register("otherCerts")}
                multiple
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                {OTHER_CERT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Label Languages
              </label>
              <input
                {...register("labelLanguages")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {/* ── Section 3 - GCC Ambitions ── */}
        <Section title="3 · GCC Ambitions">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Target Markets
              </label>
              <select
                {...register("targetMarkets")}
                multiple
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                {TARGET_MARKET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Sales Channels
              </label>
              <select
                {...register("salesChannels")}
                multiple
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                {SALES_CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Timeline for First Sale
              </label>
              <select
                {...register("timeline")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Revenue Target - Year 1
              </label>
              <input
                {...register("revenueYear1Target")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Revenue Target - Year 3
              </label>
              <input
                {...register("revenueYear3Target")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                GCC Contact
              </label>
              <select
                {...register("gccContact")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                GCC Contact Details
              </label>
              <input
                {...register("gccContactDetails")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Distribution Partner
              </label>
              <select
                {...register("distributionPartner")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Distribution Details
              </label>
              <input
                {...register("distributionDetails")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {/* ── Section 4 - Operational Readiness ── */}
        <Section title="4 · Operational Readiness">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Minimum Order Quantity
              </label>
              <input
                {...register("moq")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Dedicated Export Contact
              </label>
              <select
                {...register("exportContact")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Production Capacity
              </label>
              <select
                {...register("productionCapacity")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {CAPACITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                SFDA / ADAFSA Registration
              </label>
              <select
                {...register("sfdaStatus")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {SFDA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Section 5 - Flexibility & Commitment ── */}
        <Section title="5 · Flexibility & Commitment">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Product Adaptability
              </label>
              <select
                {...register("productAdaptability")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {ADAPTABILITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Budget Allocated
              </label>
              <select
                {...register("budget")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Partnership Horizon
              </label>
              <select
                {...register("partnershipHorizon")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {HORIZON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Brand Activation Support
              </label>
              <select
                {...register("brandActivation")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {ACTIVATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Section 6 - Decision-Maker Contact ── */}
        <Section title="6 · Decision-Maker Contact">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Full Name *
              </label>
              <input
                {...register("contactFullName")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.contactFullName && (
                <p className="mt-1 text-xs text-red-600">{errors.contactFullName.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Title / Position
              </label>
              <input
                {...register("contactTitle")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Email *
              </label>
              <input
                {...register("contactEmail")}
                type="email"
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Phone
              </label>
              <input
                {...register("contactPhone")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Has Signing Authority
              </label>
              <select
                {...register("hasSigningAuthority")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Signing Authority Contact
              </label>
              <input
                {...register("signingAuthorityContact")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Anything Else
              </label>
              <textarea
                {...register("anythingElse")}
                rows={2}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {/* ── Status & Notes ── */}
        <Section title="Status & Notes">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Customer Status
              </label>
              <select
                {...register("customerStatus")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Onboarding Date
              </label>
              <input
                type="date"
                {...register("onboardingDate")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Notes
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Add any notes about this customer (negotiation details, etc.)"
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-teal px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md hover:-translate-y-px active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update Customer" : "Add Customer"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/customers")}
            className="rounded border border-brand-line px-6 py-2 text-sm text-brand-muted hover:bg-brand-bg-alt"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}