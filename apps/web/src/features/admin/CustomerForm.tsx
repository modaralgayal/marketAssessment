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
  GCC_MARKET_OPTIONS,
  SALES_CHANNEL_OPTIONS,
  FROZEN_STORAGE_OPTIONS,
  SHELF_LIFE_OPTIONS,
  BRAND_APPROACH_OPTIONS,
  TARGET_POTENTIAL_OPTIONS,
  CAPACITY_OPTIONS,
  SFDA_OPTIONS,
  ADAPTABILITY_OPTIONS,
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

const boolSelect = {
  setValueAs: (v: unknown) => (v === "true" ? true : v === "false" ? false : undefined),
};

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
            annualRevenueCustom: customer.annualRevenueCustom ?? undefined,
            yearsInBusiness: customer.yearsInBusiness ?? undefined,
            currentExportMarkets: customer.currentExportMarkets ?? undefined,
            halalCert: customer.halalCert ?? undefined,
            sfdaStatus: customer.sfdaStatus ?? undefined,
            frozenStorage: customer.frozenStorage ?? undefined,
            shelfLife: customer.shelfLife ?? undefined,
            otherCerts: customer.otherCerts ?? [],
            otherCertsCustom: customer.otherCertsCustom ?? undefined,
            labelLanguages: customer.labelLanguages ?? undefined,
            productAdaptability: customer.productAdaptability ?? undefined,
            brandApproach: customer.brandApproach ?? undefined,
            leadTimes: customer.leadTimes ?? undefined,
            gccCurrentlyActive: customer.gccCurrentlyActive ?? undefined,
            currentGccMarkets: customer.currentGccMarkets ?? [],
            gccSituation: customer.gccSituation ?? undefined,
            targetMarketPotential: customer.targetMarketPotential ?? undefined,
            targetMarketPotentialOther: customer.targetMarketPotentialOther ?? undefined,
            salesChannels: customer.salesChannels ?? [],
            channelStrategy: customer.channelStrategy ?? undefined,
            moq: customer.moq ?? undefined,
            exportContact: customer.exportContact ?? undefined,
            productionCapacity: customer.productionCapacity ?? undefined,
            contactFullName: customer.contactFullName,
            contactTitle: customer.contactTitle ?? undefined,
            contactEmail: customer.contactEmail,
            contactPhone: customer.contactPhone ?? undefined,
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
                Annual Revenue *
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
              {errors.annualRevenue && (
                <p className="mt-1 text-xs text-red-600">{errors.annualRevenue.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Annual Revenue (Custom)
              </label>
              <input
                {...register("annualRevenueCustom")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
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

        {/* ── Section 2 - Products and Operations ── */}
        <Section title="2 · Products and Operations">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Halal Certification *
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

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Frozen Storage Required *
              </label>
              <select
                {...register("frozenStorage")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {FROZEN_STORAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Shelf Life *
              </label>
              <select
                {...register("shelfLife")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {SHELF_LIFE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Product Adaptability *
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
                Branding & Promotional Approach *
              </label>
              <select
                {...register("brandApproach")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {BRAND_APPROACH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Valid Certifications
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
                Other Certifications (Custom)
              </label>
              <input
                {...register("otherCertsCustom")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
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

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Lead Times
              </label>
              <input
                {...register("leadTimes")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>
          </div>
        </Section>

        {/* ── Section 3 - Target Market ── */}
        <Section title="3 · Target Market">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Currently Active in GCC *
              </label>
              <select
                {...register("gccCurrentlyActive", boolSelect)}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Target Market Potential
              </label>
              <select
                {...register("targetMarketPotential")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                {TARGET_POTENTIAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Target Market Potential (Other)
              </label>
              <input
                {...register("targetMarketPotentialOther")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Current GCC Markets
              </label>
              <select
                {...register("currentGccMarkets")}
                multiple
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                {GCC_MARKET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Current GCC Situation
              </label>
              <textarea
                {...register("gccSituation")}
                rows={3}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Channel Strategy
              </label>
              <textarea
                {...register("channelStrategy")}
                rows={3}
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
                {...register("exportContact", boolSelect)}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Production Capacity *
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
          </div>
        </Section>

        {/* ── Section 5 - Decision-Maker Contact ── */}
        <Section title="5 · Decision-Maker Contact">
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
                Title / Position *
              </label>
              <input
                {...register("contactTitle")}
                className="w-full rounded border border-brand-line px-3 py-2 text-sm outline-none focus:border-brand-teal"
              />
              {errors.contactTitle && (
                <p className="mt-1 text-xs text-red-600">{errors.contactTitle.message}</p>
              )}
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
