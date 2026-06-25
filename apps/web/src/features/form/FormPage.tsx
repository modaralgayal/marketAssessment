import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  submissionSchema,
  type SubmissionInput,
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
  FILE_CONSTRAINTS,
} from "@mea/shared";
import { submitAssessment } from "../../lib/api";
import {
  SectionHeader,
  Field,
  TextInput,
  TextArea,
  RadioChips,
  CheckboxChips,
  YesNoChips,
} from "./fields";
import { CoverHeader, PromiseRow, IntroBox, SuccessScreen } from "./Chrome";

export default function FormPage() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { otherCerts: [], targetMarkets: [], salesChannels: [] },
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFileError(null);
    if (picked.length > FILE_CONSTRAINTS.maxFiles) {
      setFileError(`Please attach at most ${FILE_CONSTRAINTS.maxFiles} files.`);
      return;
    }
    const tooBig = picked.find((f) => f.size > FILE_CONSTRAINTS.maxBytes);
    if (tooBig) {
      setFileError(`"${tooBig.name}" exceeds the 15 MB limit.`);
      return;
    }
    setFiles(picked);
  };

  const onSubmit = async (data: SubmissionInput) => {
    setSubmitError(null);
    if (files.length === 0) {
      setFileError("A catalogue / price list is required.");
      return;
    }
    setSubmitting(true);
    try {
      await submitAssessment(data, files);
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <SuccessScreen />;

  return (
    <div className="mx-auto my-0 max-w-[820px] bg-white">
      <CoverHeader />
      <PromiseRow />
      <IntroBox />

      <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-16 sm:px-16">
        {/* ── 1. Company Profile ── */}
        <SectionHeader num={1} title="Company Profile" sub="Basic information about your business" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Company Name" error={errors.companyName?.message}>
            <TextInput name="companyName" register={register} placeholder="Legal company name" />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <TextInput name="country" register={register} placeholder="Country of registration" />
          </Field>
        </div>
        <Field label="Website">
          <TextInput name="website" register={register} placeholder="www.yourcompany.com" />
        </Field>
        <Field
          label="Industry / Product Category"
          note="e.g. Dairy, Bakery, Confectionery, Beverages, Meat & Poultry, Cosmetics, Health Foods…"
          error={errors.industryCategory?.message}
        >
          <TextInput name="industryCategory" register={register} placeholder="Describe your category" />
        </Field>
        <Field label="Annual Revenue">
          <RadioChips name="annualRevenue" control={control} options={REVENUE_OPTIONS} />
        </Field>
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Years in Business">
            <TextInput name="yearsInBusiness" register={register} placeholder="e.g. 12 years" />
          </Field>
          <Field label="Current Export Markets">
            <TextInput
              name="currentExportMarkets"
              register={register}
              placeholder="e.g. Sweden, Germany — or 'domestic only'"
            />
          </Field>
        </div>

        {/* ── 2. Your Product ── */}
        <SectionHeader num={2} title="Your Product" sub="What you're bringing to market" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Product Name(s)" error={errors.productNames?.message}>
            <TextInput name="productNames" register={register} placeholder="Main product line(s)" />
          </Field>
          <Field label="Number of SKUs">
            <TextInput name="numberOfSkus" register={register} placeholder="e.g. 8 SKUs across 3 lines" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Shelf Life" note="In months from production date">
            <TextInput name="shelfLife" register={register} placeholder="e.g. 18 months" />
          </Field>
          <Field label="Ex-Works Price Range" note="Per unit or per kg">
            <TextInput name="exWorksPriceRange" register={register} placeholder="e.g. €2.50–€4.00 per unit" />
          </Field>
        </div>
        <Field label="Halal Certification">
          <RadioChips name="halalCert" control={control} options={YES_NO_UNSURE_OPTIONS} />
        </Field>
        <Field label="Other Certifications Held" note="Select all that apply">
          <CheckboxChips name="otherCerts" control={control} options={OTHER_CERT_OPTIONS} />
        </Field>
        <Field
          label="Label Languages Currently Available"
          note="List the languages your product labels are currently printed in"
        >
          <TextInput name="labelLanguages" register={register} placeholder="e.g. Finnish, English — or 'English only'" />
        </Field>

        {/* File upload */}
        <div className="mt-1.5 rounded-md border-[1.5px] border-dashed border-gray-400 bg-light-gray p-4">
          <p className="text-[12.5px] text-gray-600">
            <strong className="text-dark-blue">Required:</strong> Attach your current product catalogue and
            price list. Each product should include SKU codes, specifications, certifications, shelf life,
            packaging format/dimensions, and ex-works prices. (PDF, Excel, Word, CSV — up to 15 MB each.)
          </p>
          <input
            type="file"
            multiple
            accept={FILE_CONSTRAINTS.allowedExtensions.join(",")}
            onChange={onFileChange}
            className="mt-3 block w-full text-[12.5px] text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-mid-blue file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-dark-blue"
          />
          {files.length > 0 && (
            <ul className="mt-2 text-[12px] text-gray-600">
              {files.map((f) => (
                <li key={f.name}>• {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          )}
          {fileError && <p className="mt-2 text-[11.5px] text-red-600">{fileError}</p>}
        </div>

        {/* ── 3. GCC Ambitions ── */}
        <SectionHeader num={3} title="Your GCC Ambitions" sub="Where you want to go" />
        <Field label="Target Markets" note="Select all that apply">
          <CheckboxChips name="targetMarkets" control={control} options={TARGET_MARKET_OPTIONS} />
        </Field>
        <Field label="Sales Channels of Interest" note="Select all that apply">
          <CheckboxChips name="salesChannels" control={control} options={SALES_CHANNEL_OPTIONS} />
        </Field>
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Target Timeline for First Sale">
            <RadioChips name="timeline" control={control} options={TIMELINE_OPTIONS} />
          </Field>
          <div>
            <Field label="Revenue Expectations — Year 1 (€)">
              <TextInput name="revenueYear1Target" register={register} placeholder="e.g. €50,000–€100,000" />
            </Field>
            <Field label="Revenue Expectations — Year 3 (€)">
              <TextInput name="revenueYear3Target" register={register} placeholder="e.g. €300,000–€500,000" />
            </Field>
          </div>
        </div>
        <Field label="Prior or Current Contact with GCC Buyers / Distributors">
          <YesNoChips name="gccContact" control={control} />
          <div className="mt-2.5">
            <TextArea
              name="gccContactDetails"
              register={register}
              rows={2}
              placeholder="If yes, briefly describe (e.g. met two UAE distributors at Gulfood 2024, no contracts)."
            />
          </div>
        </Field>
        <Field label="Current or Prior Distribution Partner in Your Target Market?">
          <YesNoChips name="distributionPartner" control={control} />
          <div className="mt-2.5">
            <TextArea
              name="distributionDetails"
              register={register}
              rows={2}
              placeholder="If yes: company name, market, and current status of the relationship."
            />
          </div>
        </Field>

        {/* ── 4. Operational Readiness ── */}
        <SectionHeader num={4} title="Operational Readiness" sub="Your capacity to serve a new market" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Minimum Order Quantity (MOQ)" note="For a first export order">
            <TextInput name="moq" register={register} placeholder="e.g. 500 units / 1 pallet / 1 container" />
          </Field>
          <Field label="Dedicated Export Contact" note="Do you have an export manager / designated contact?">
            <YesNoChips name="exportContact" control={control} />
          </Field>
        </div>
        <Field label="Can You Dedicate Production Capacity to a New Export Market?">
          <RadioChips name="productionCapacity" control={control} options={CAPACITY_OPTIONS} />
        </Field>
        <Field
          label="SFDA or ADAFSA Product Registration"
          note="SFDA = Saudi Food & Drug Authority | ADAFSA = Abu Dhabi Agriculture & Food Safety Authority"
        >
          <RadioChips name="sfdaStatus" control={control} options={SFDA_OPTIONS} />
        </Field>

        {/* ── 5. Flexibility & Commitment ── */}
        <SectionHeader num={5} title="Flexibility & Commitment" sub="How you approach a new partnership" />
        <Field
          label="Product Adaptability"
          note="GCC markets may require changes to packaging, label language, sizing, or specs. Are you willing to adapt?"
        >
          <RadioChips name="productAdaptability" control={control} options={ADAPTABILITY_OPTIONS} />
        </Field>
        <Field
          label="Budget Allocated for GCC Market Entry"
          note="Including certifications, market entry costs, and partnership fees"
        >
          <RadioChips name="budget" control={control} options={BUDGET_OPTIONS} />
        </Field>
        <Field label="Partnership Horizon">
          <RadioChips name="partnershipHorizon" control={control} options={HORIZON_OPTIONS} />
        </Field>
        <Field
          label="Brand Activation Support"
          note="Entry often needs brand-building (sampling, social, in-store promos, intro discounts). Willing to support?"
        >
          <RadioChips name="brandActivation" control={control} options={ACTIVATION_OPTIONS} />
        </Field>

        {/* ── 6. Decision-Maker Contact ── */}
        <SectionHeader num={6} title="Decision-Maker Contact" sub="Who we'll be speaking with" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Full Name" error={errors.contactFullName?.message}>
            <TextInput name="contactFullName" register={register} placeholder="First and last name" />
          </Field>
          <Field label="Title / Position">
            <TextInput name="contactTitle" register={register} placeholder="e.g. Export Director, CEO" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Email Address" error={errors.contactEmail?.message}>
            <TextInput name="contactEmail" register={register} type="email" placeholder="your@company.com" />
          </Field>
          <Field label="Phone Number">
            <TextInput name="contactPhone" register={register} type="tel" placeholder="+358 XX XXX XXXX" />
          </Field>
        </div>
        <Field label="Are you the person who signs commercial agreements?">
          <YesNoChips name="hasSigningAuthority" control={control} />
          <div className="mt-2.5">
            <TextInput
              name="signingAuthorityContact"
              register={register}
              placeholder="If no — name and title of the person with signing authority"
            />
          </div>
        </Field>
        <Field label="Anything Else You'd Like Us to Know?">
          <TextArea
            name="anythingElse"
            register={register}
            rows={3}
            placeholder="Additional context, questions, or anything relevant to your GCC ambitions…"
          />
        </Field>

        {/* Submit */}
        <div className="mt-8 border-t border-border pt-6">
          {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-orange px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Assessment"}
          </button>
          <p className="mt-3 text-[11.5px] italic text-gray-400">
            We'll review your submission and respond within 5 business days.
          </p>
        </div>
      </form>
    </div>
  );
}
