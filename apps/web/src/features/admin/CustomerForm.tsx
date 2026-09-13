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
import { COUNTRIES } from "../landing/countries";
import { fetchCustomer, createCustomer, updateCustomer } from "../../lib/api";
import AdminLayout from "./AdminLayout";
import {
  Section,
  Field,
  TextInput,
  TextArea,
  SelectField,
  MultiSelectDropdown,
} from "../form/fields";

const COUNTRY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = COUNTRIES.map((c) => ({
  value: c,
  label: c,
}));

const YES_NO: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = customerStatuses.map(
  (s) => ({ value: s, label: s }),
);

export default function CustomerForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
  });

  const otherCerts = watch("otherCerts");
  const gccCurrentlyActive = watch("gccCurrentlyActive");
  const annualRevenue = watch("annualRevenue");
  const targetMarketPotential = watch("targetMarketPotential");

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
            catalogueLink: customer.catalogueLink ?? undefined,
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── 1. Company Profile ── */}
        <Section num={1} title="Company Profile" sub="Basic information about the business">
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Company Name" required error={errors.companyName?.message}>
              <TextInput name="companyName" register={register} placeholder="Legal company name" />
            </Field>
            <Field label="Country" required error={errors.country?.message}>
              <SelectField
                name="country"
                control={control}
                options={COUNTRY_OPTIONS}
                placeholder="Select a country"
                searchable
              />
            </Field>
          </div>
          <Field label="Website" error={errors.website?.message}>
            <TextInput name="website" register={register} placeholder="www.company.com" />
          </Field>
          <Field
            label="Industry / Product Category"
            required
            error={errors.industryCategory?.message}
          >
            <TextInput name="industryCategory" register={register} placeholder="e.g. Dairy, Beverages" />
          </Field>
          <Field label="Annual Revenue" required error={errors.annualRevenue?.message}>
            <SelectField
              name="annualRevenue"
              control={control}
              options={REVENUE_OPTIONS}
              placeholder="Select a range"
            />
          </Field>
          {annualRevenue === "CUSTOM" && (
            <Field label="Annual Revenue (specified)" error={errors.annualRevenueCustom?.message}>
              <TextInput
                name="annualRevenueCustom"
                register={register}
                placeholder="Describe the custom revenue figure"
              />
            </Field>
          )}
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Years in Business" error={errors.yearsInBusiness?.message}>
              <TextInput name="yearsInBusiness" register={register} placeholder="e.g. 12 years" />
            </Field>
            <Field label="Current Export Markets" error={errors.currentExportMarkets?.message}>
              <TextInput
                name="currentExportMarkets"
                register={register}
                placeholder="e.g. Sweden, Germany, Poland"
              />
            </Field>
          </div>
        </Section>

        {/* ── 2. Products and Operations ── */}
        <Section num={2} title="Products and Operations" sub="What they bring to market">
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Halal Certification" required error={errors.halalCert?.message}>
              <SelectField
                name="halalCert"
                control={control}
                options={YES_NO_UNSURE_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="SFDA / ADAFSA Registration"
              note="SFDA = Saudi · ADAFSA = Abu Dhabi"
              error={errors.sfdaStatus?.message}
            >
              <SelectField
                name="sfdaStatus"
                control={control}
                options={SFDA_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="Frozen Storage Required?"
              note="Needed for frozen / chilled products"
              error={errors.frozenStorage?.message}
            >
              <SelectField
                name="frozenStorage"
                control={control}
                options={FROZEN_STORAGE_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="Shelf Life"
              note="Typical shelf life of most products"
              error={errors.shelfLife?.message}
            >
              <SelectField
                name="shelfLife"
                control={control}
                options={SHELF_LIFE_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="Product Adaptability"
              note="Open to adapting specs / labels / packaging?"
              error={errors.productAdaptability?.message}
            >
              <SelectField
                name="productAdaptability"
                control={control}
                options={ADAPTABILITY_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="Branding & Promotional Approach"
              error={errors.brandApproach?.message}
            >
              <SelectField
                name="brandApproach"
                control={control}
                options={BRAND_APPROACH_OPTIONS}
                placeholder="Select"
              />
            </Field>
          </div>
          <Field label="Valid Certifications" note="Select all that apply">
            <MultiSelectDropdown
              name="otherCerts"
              control={control}
              options={OTHER_CERT_OPTIONS}
              placeholder="Select certifications"
            />
          </Field>
          {otherCerts?.includes("CUSTOM") && (
            <Field label="Other Certifications (specified)" error={errors.otherCertsCustom?.message}>
              <TextInput
                name="otherCertsCustom"
                register={register}
                placeholder="e.g. Rainforest Alliance, Fair Trade, NSF…"
              />
            </Field>
          )}
          <Field label="Label Languages" note="Languages on current labels" error={errors.labelLanguages?.message}>
            <TextInput name="labelLanguages" register={register} placeholder="e.g. English, Finnish" />
          </Field>
          <Field label="Lead Times" note="Order to delivery" error={errors.leadTimes?.message}>
            <TextInput name="leadTimes" register={register} placeholder="e.g. 3–4 weeks" />
          </Field>
          <Field label="Catalogue Link" note="Optional link to a catalogue / price list">
            <TextInput
              name="catalogueLink"
              register={register}
              type="url"
              placeholder="https://…"
            />
          </Field>
        </Section>

        {/* ── 3. Target Market ── */}
        <Section num={3} title="Target Market" sub="GCC presence and market priorities">
          <Field label="Currently Active in Any GCC Market?" required error={errors.gccCurrentlyActive?.message}>
            <SelectField name="gccCurrentlyActive" control={control} options={YES_NO} placeholder="Select" />
          </Field>
          {gccCurrentlyActive === true && (
            <>
              <Field label="Current GCC Markets" note="Select all that apply">
                <MultiSelectDropdown
                  name="currentGccMarkets"
                  control={control}
                  options={GCC_MARKET_OPTIONS}
                  placeholder="Select markets"
                />
              </Field>
              <Field
                label="Current GCC Situation"
                note="What's working, what isn't, where's the upside"
                error={errors.gccSituation?.message}
              >
                <TextArea
                  name="gccSituation"
                  register={register}
                  rows={3}
                  placeholder="Describe the current GCC situation"
                />
              </Field>
            </>
          )}
          {gccCurrentlyActive === false && (
            <Field
              label="Target Market Potential"
              note="Which market shows the greatest potential"
              error={errors.targetMarketPotential?.message}
            >
              <SelectField
                name="targetMarketPotential"
                control={control}
                options={TARGET_POTENTIAL_OPTIONS}
                placeholder="Select a market"
              />
            </Field>
          )}
          {targetMarketPotential === "OTHER" && (
            <Field label="Other Markets (specified)" error={errors.targetMarketPotentialOther?.message}>
              <TextInput name="targetMarketPotentialOther" register={register} placeholder="e.g. Kuwait, Qatar" />
            </Field>
          )}
          <Field label="Sales Channels" note="Select all that apply">
            <MultiSelectDropdown
              name="salesChannels"
              control={control}
              options={SALES_CHANNEL_OPTIONS}
              placeholder="Select channels"
            />
          </Field>
          <Field label="Channel Strategy" note="Priorities and approach">
            <TextArea
              name="channelStrategy"
              register={register}
              rows={3}
              placeholder="Which channels matter most, and why?"
            />
          </Field>
        </Section>

        {/* ── 4. Operational Readiness ── */}
        <Section num={4} title="Operational Readiness" sub="Capacity to serve a new market">
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Minimum Order Quantity (MOQ)" note="For a first export order" error={errors.moq?.message}>
              <TextInput name="moq" register={register} placeholder="e.g. 1 pallet" />
            </Field>
            <Field
              label="Dedicated Export Contact?"
              note="An export manager or point of contact"
              error={errors.exportContact?.message}
            >
              <SelectField name="exportContact" control={control} options={YES_NO} placeholder="Select" />
            </Field>
          </div>
          <Field label="Production Capacity" required error={errors.productionCapacity?.message}>
            <SelectField
              name="productionCapacity"
              control={control}
              options={CAPACITY_OPTIONS}
              placeholder="Select"
            />
          </Field>
        </Section>

        {/* ── 5. Decision-Maker Contact ── */}
        <Section num={5} title="Decision-Maker Contact" sub="Who we'll be speaking with">
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Full Name" required error={errors.contactFullName?.message}>
              <TextInput name="contactFullName" register={register} placeholder="First and last name" />
            </Field>
            <Field label="Title / Position" required error={errors.contactTitle?.message}>
              <TextInput name="contactTitle" register={register} placeholder="e.g. Export Director" />
            </Field>
            <Field label="Email Address" required error={errors.contactEmail?.message}>
              <TextInput name="contactEmail" register={register} type="email" placeholder="your@company.com" />
            </Field>
            <Field label="Phone Number" error={errors.contactPhone?.message}>
              <TextInput name="contactPhone" register={register} type="tel" placeholder="+358 XX XXX XXXX" />
            </Field>
          </div>
          <Field
            label="Anything Else?"
            note="Any context that helps — past exports, GCC ambitions, challenges."
            error={errors.anythingElse?.message}
          >
            <TextArea
              name="anythingElse"
              register={register}
              rows={4}
              placeholder="Anything else that helps us understand the products or ambitions."
            />
          </Field>
        </Section>

        {/* ── Status & Notes ── */}
        <Section num={6} title="Status & Notes" sub="Pipeline state and internal notes">
          <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
            <Field label="Customer Status" error={errors.customerStatus?.message}>
              <SelectField
                name="customerStatus"
                control={control}
                options={STATUS_OPTIONS}
                placeholder="Select a status"
              />
            </Field>
            <Field label="Onboarding Date" error={errors.onboardingDate?.message}>
              <input
                type="date"
                {...register("onboardingDate")}
                className="block w-full rounded border border-brand-line bg-white px-3 py-2 text-[13px] text-brand-ink outline-none focus:border-brand-teal"
              />
            </Field>
          </div>
          <Field label="Notes" note="Negotiation details, context, etc.">
            <TextArea
              name="notes"
              register={register}
              rows={3}
              placeholder="Add any notes about this customer."
            />
          </Field>
        </Section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
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
