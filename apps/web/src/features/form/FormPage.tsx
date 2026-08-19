import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  submissionSchema,
  type SubmissionInput,
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
import SiteNav from "../landing/SiteNav";

// Human-readable names for each schema field, used to name the missing items
// in the "Please complete the following" banner so the user knows what's empty
// even when the offending field is scrolled out of view.
const FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  country: "Country",
  website: "Website",
  industryCategory: "Industry / product category",
  annualRevenue: "Annual revenue",
  annualRevenueCustom: "Annual revenue (specify)",
  yearsInBusiness: "Years in business",
  currentExportMarkets: "Current export markets",
  halalCert: "Halal certification",
  sfdaStatus: "SFDA / ADAFSA registration",
  frozenStorage: "Frozen storage",
  shelfLife: "Shelf life",
  otherCerts: "Certifications",
  otherCertsCustom: "Certification (specify)",
  labelLanguages: "Label languages",
  productAdaptability: "Product adaptability",
  brandApproach: "Branding & promotional approach",
  leadTimes: "Lead times",
  gccCurrentlyActive: "GCC market activity",
  currentGccMarkets: "Current GCC markets",
  gccSituation: "Current GCC situation",
  targetMarketPotential: "Target market potential",
  targetMarketPotentialOther: "Target market (specify)",
  salesChannels: "Sales channels",
  channelStrategy: "Channel strategy",
  moq: "Minimum order quantity",
  exportContact: "Dedicated export contact",
  productionCapacity: "Production capacity",
  contactFullName: "Full name",
  contactTitle: "Title / position",
  contactEmail: "Email address",
  contactPhone: "Phone number",
  anythingElse: "Additional information",
};

// Pull the field names that failed validation out of RHF's error map.
const missingFromErrors = (errs: FieldErrors<SubmissionInput>): string[] => {
  const flat = errs as Record<string, { message?: string } | undefined>;
  const out: string[] = [];
  for (const key of Object.keys(flat)) {
    if (flat[key]?.message) out.push(FIELD_LABELS[key] ?? key);
  }
  return out;
};

export default function FormPage() {
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    shouldFocusError: false,
    defaultValues: {
      otherCerts: [],
      salesChannels: [],
      currentGccMarkets: [],
      gccCurrentlyActive: undefined,
    },
  });

  const consentRef = useRef<HTMLLabelElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [blockReasons, setBlockReasons] = useState<string[]>([]);

  /**
   * Scrolls to the uppermost field that failed validation and, if it contains a
   * focusable control, focuses it. Runs after React re-renders the error text.
   */
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const errs = Array.from(
        document.querySelectorAll<HTMLElement>('[data-error="true"]'),
      );
      if (errs.length === 0) return;
      errs.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const top = errs[0];
      if (!top) return;
      top.scrollIntoView({ behavior: "smooth", block: "center" });
      top.parentElement
        ?.querySelector<HTMLElement>("input, textarea, button")
        ?.focus({ preventScroll: true });
    });
  };

  /**
   * Runs when React Hook Form validation fails. RHF only blocks `onSubmit` when
   * a registered field is invalid, so the file and consent checks (which live
   * outside RHF) must run HERE too — otherwise a submit with every field empty
   * would never light up the catalogue or consent boxes.
   */
  const onInvalid = (errs: FieldErrors<SubmissionInput>) => {
    const reasons: string[] = [...missingFromErrors(errs)];
    if (files.length === 0) {
      setFileError("A catalogue / price list is required.");
      reasons.push("Attach your export catalogue / price list");
    }
    if (!consent) {
      setConsentError(true);
      reasons.push("Accept the Privacy Policy (AI processing consent)");
    }
    setBlockReasons(reasons);
    scrollToFirstError();
  };

  const gccCurrentlyActive = watch("gccCurrentlyActive");
  const annualRevenue = watch("annualRevenue");
  const otherCerts = watch("otherCerts");
  const targetMarketPotential = watch("targetMarketPotential");

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
    setBlockReasons([]);
  };

  const onSubmit = async (data: SubmissionInput) => {
    setSubmitError(null);
    const reasons: string[] = [];
    if (files.length === 0) {
      setFileError("A catalogue / price list is required.");
      reasons.push("Attach your export catalogue / price list");
    }
    if (!consent) {
      setConsentError(true);
      reasons.push("Accept the Privacy Policy (AI processing consent)");
    }
    if (reasons.length > 0) {
      setBlockReasons(reasons);
      scrollToFirstError();
      return;
    }
    setBlockReasons([]);
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

  if (done)
    return (
      <>
        <SiteNav />
        <SuccessScreen />
      </>
    );

  return (
    <>
      <SiteNav />
      <div className="w-full bg-white">
        <CoverHeader />
      <PromiseRow />
      <IntroBox />

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="px-8 pb-16 sm:px-16">
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
        <Field label="Website" error={errors.website?.message}>
          <TextInput name="website" register={register} placeholder="www.yourcompany.com" />
        </Field>
        <Field
          label="Industry / Product Category"
          note="e.g. Dairy, Bakery, Confectionery, Beverages, Meat & Poultry, Cosmetics, Health Foods…"
          error={errors.industryCategory?.message}
        >
          <TextInput name="industryCategory" register={register} placeholder="Describe your category" />
        </Field>
        <Field label="Annual Revenue" error={errors.annualRevenue?.message}>
          <RadioChips name="annualRevenue" control={control} options={REVENUE_OPTIONS} />
        </Field>
        {annualRevenue === "CUSTOM" && (
          <Field label="Please specify your annual revenue" error={errors.annualRevenueCustom?.message}>
            <TextInput
              name="annualRevenueCustom"
              register={register}
              placeholder="e.g. approx. €750M"
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
              placeholder="e.g. Sweden, Germany, Poland — or 'domestic only'"
            />
          </Field>
        </div>

        {/* ── 2. Products and Operations ── */}
        <SectionHeader num={2} title="Products and Operations" sub="What you're bringing to market" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field
            label="Shelf Life"
            note="Typical shelf life of the majority of your products"
            error={errors.shelfLife?.message}
          >
            <RadioChips name="shelfLife" control={control} options={SHELF_LIFE_OPTIONS} />
          </Field>
          <Field
            label="Do your products require frozen storage and transportation?"
            error={errors.frozenStorage?.message}
          >
            <RadioChips name="frozenStorage" control={control} options={FROZEN_STORAGE_OPTIONS} />
          </Field>
        </div>
        <Field
          label="Halal Certification"
          note="Required for GCC market entry"
          error={errors.halalCert?.message}
        >
          <RadioChips name="halalCert" control={control} options={YES_NO_UNSURE_OPTIONS} />
        </Field>
        <Field
          label="SFDA or ADAFSA Product Registration"
          note="SFDA = Saudi Food & Drug Authority | ADAFSA = Abu Dhabi Agriculture & Food Safety Authority"
          error={errors.sfdaStatus?.message}
        >
          <RadioChips name="sfdaStatus" control={control} options={SFDA_OPTIONS} />
        </Field>
        <Field label="Valid Certifications" note="Select all valid certifications currently held by your company.">
          <CheckboxChips name="otherCerts" control={control} options={OTHER_CERT_OPTIONS} />
        </Field>
        {otherCerts?.includes("CUSTOM") && (
          <Field label="Please specify other certification(s)" error={errors.otherCertsCustom?.message}>
            <TextInput
              name="otherCertsCustom"
              register={register}
              placeholder="e.g. Rainforest Alliance, Fair Trade, NSF…"
            />
          </Field>
        )}
        <Field label="Label Languages Currently Available" note="List the languages your product labels are currently printed in" error={errors.labelLanguages?.message}>
          <TextInput
            name="labelLanguages"
            register={register}
            placeholder="e.g. Finnish, English, Swedish — or 'English only'"
          />
        </Field>
        <Field
          label="Product Adaptability"
          note="GCC markets may require adjustments to packaging format, label language, sizing, or product specifications. Is your company willing to adapt if distributors or market testing require it?"
          error={errors.productAdaptability?.message}
        >
          <RadioChips name="productAdaptability" control={control} options={ADAPTABILITY_OPTIONS} />
        </Field>
        <Field
          label="Branding & Promotional Approach"
          note="How would you describe your approach to branding and promotional investment when entering a new market?"
          error={errors.brandApproach?.message}
        >
          <RadioChips name="brandApproach" control={control} options={BRAND_APPROACH_OPTIONS} />
        </Field>
        <Field label="Lead Times" note="What is your usual lead time from order confirmation to delivery?" error={errors.leadTimes?.message}>
          <TextInput name="leadTimes" register={register} placeholder="e.g. 3–4 weeks from order confirmation" />
        </Field>

        {/* File upload */}
        <div
          className={`mt-1.5 rounded-md border-[1.5px] border-dashed p-4 ${
            fileError
              ? "border-red-300 bg-red-50/40"
              : "border-brand-muted/40 bg-brand-bg-alt"
          }`}
        >
          <p className="text-[12.5px] text-brand-muted">
            <strong className="text-brand-ink">Required:</strong> Attach your latest export catalogue
            (product specifications, certifications, shelf life, packaging formats and dimensions, and
            pricing where available). Submissions without a catalogue cannot be fully assessed.
          </p>
          <input
            type="file"
            multiple
            accept={FILE_CONSTRAINTS.allowedExtensions.join(",")}
            onChange={onFileChange}
            className="mt-3 block w-full text-[12.5px] text-brand-ink file:mr-3 file:rounded file:border-0 file:bg-brand-teal file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-teal-dark"
          />
          {files.length > 0 && (
            <ul className="mt-2 text-[12px] text-brand-muted">
              {files.map((f) => (
                <li key={f.name}>• {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
              ))}
            </ul>
          )}
          {fileError && (
            <p
              data-error="true"
              className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11.5px] font-medium text-red-600 ring-1 ring-inset ring-red-200"
            >
              {fileError}
            </p>
          )}
        </div>

        {/* ── 3. Target Market ── */}
        <SectionHeader num={3} title="Target Market" sub="Your GCC presence and market priorities" />
        <Field
          label="Are your products available in any of the GCC markets?"
          error={errors.gccCurrentlyActive?.message}
        >
          <YesNoChips name="gccCurrentlyActive" control={control} />
        </Field>
        {gccCurrentlyActive === true && (
          <>
            <Field label="Which GCC markets are you currently active in?">
              <CheckboxChips name="currentGccMarkets" control={control} options={GCC_MARKET_OPTIONS} />
            </Field>
            <Field
              label="Describe your current GCC situation"
              note="Are you satisfied with your sales and your distribution partner? Is there unrealized growth potential in your active channels or in different channels?"
              error={errors.gccSituation?.message}
            >
              <TextArea
                name="gccSituation"
                register={register}
                rows={3}
                placeholder="Tell us about your current GCC performance — what's working, what isn't, and where you see untapped potential…"
              />
            </Field>
          </>
        )}
        {gccCurrentlyActive === false && (
          <Field
            label="Which markets, in your assessment, show the greatest potential for your products?"
            error={errors.targetMarketPotential?.message}
          >
            <RadioChips name="targetMarketPotential" control={control} options={TARGET_POTENTIAL_OPTIONS} />
          </Field>
        )}
        {targetMarketPotential === "OTHER" && (
          <Field label="If other, please specify" error={errors.targetMarketPotentialOther?.message}>
            <TextInput name="targetMarketPotentialOther" register={register} placeholder="e.g. Kuwait, Qatar" />
          </Field>
        )}
        <Field label="Sales Channels of Interest" note="Select all that apply">
          <CheckboxChips name="salesChannels" control={control} options={SALES_CHANNEL_OPTIONS} />
        </Field>
        <Field
          label="Channel Strategy"
          note="Describe your channel priorities and approach — which channels matter most to you and why"
        >
          <TextArea
            name="channelStrategy"
            register={register}
            rows={3}
            placeholder="e.g. We want to prioritise modern trade in KSA through a national distributor, with e-commerce as a secondary channel once the brand is established…"
          />
        </Field>

        {/* ── 4. Operational Readiness ── */}
        <SectionHeader num={4} title="Operational Readiness" sub="Your capacity to serve a new market" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Minimum Order Quantity (MOQ)" note="For a first export order" error={errors.moq?.message}>
            <TextInput name="moq" register={register} placeholder="e.g. 500 units / 1 pallet / 1 container" />
          </Field>
          <Field label="Dedicated Export Contact" note="Do you have an export manager or designated contact?" error={errors.exportContact?.message}>
            <YesNoChips name="exportContact" control={control} />
          </Field>
        </div>
        <Field
          label="Can You Dedicate Production Capacity to a New Export Market?"
          error={errors.productionCapacity?.message}
        >
          <RadioChips name="productionCapacity" control={control} options={CAPACITY_OPTIONS} />
        </Field>

        {/* ── 5. Decision-Maker Contact ── */}
        <SectionHeader num={5} title="Decision-Maker Contact" sub="Who we'll be speaking with" />
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Full Name" error={errors.contactFullName?.message}>
            <TextInput name="contactFullName" register={register} placeholder="First and last name" />
          </Field>
          <Field label="Title / Position" error={errors.contactTitle?.message}>
            <TextInput name="contactTitle" register={register} placeholder="e.g. Export Director, CEO, Sales Manager" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          <Field label="Email Address" error={errors.contactEmail?.message}>
            <TextInput name="contactEmail" register={register} type="email" placeholder="your@company.com" />
          </Field>
          <Field label="Phone Number" error={errors.contactPhone?.message}>
            <TextInput name="contactPhone" register={register} type="tel" placeholder="+358 XX XXX XXXX" />
          </Field>
        </div>
        <Field
          label="Tell Us Everything Relevant"
          note="This is your space — use it fully. The more context you give us, the more useful and accurate our evaluation will be. Tell us about your product's competitive advantages, your past export experience, challenges you've faced in other markets, your ambitions in the GCC, any specific distributor relationships or market contacts you already have, your production constraints, your brand story, or anything else that you think matters. There are no wrong answers and no irrelevant details — more information always leads to a better evaluation."
          error={errors.anythingElse?.message}
        >
          <TextArea
            name="anythingElse"
            register={register}
            rows={4}
            placeholder="Share as much as you'd like — your company's story, your product's strengths, your export history, your GCC ambitions, any relevant context about your category, your competitors, your past successes or challenges. The fuller the picture you give us, the sharper our assessment will be."
          />
        </Field>

        {/* Submit */}
        <div className="mt-8 border-t border-brand-line pt-6">
          {blockReasons.length > 0 && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              <strong>Please complete the following before submitting:</strong>
              <ul className="mt-1 list-disc pl-5">
                {blockReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}
          <label
            ref={consentRef}
            className={`mt-1 flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-3 ${
              consentError
                ? "border-red-300 bg-red-50/40"
                : "border-brand-line bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (e.target.checked) {
                  setConsentError(false);
                  setBlockReasons([]);
                }
              }}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-brand-teal"
            />
            <span className="text-[12px] leading-snug text-brand-muted">
              I have read and agree to the{" "}
              <Link to="/privacy" className="text-brand-teal underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {consentError && (
            <p
              data-error="true"
              className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11.5px] font-medium text-red-600 ring-1 ring-inset ring-red-200"
            >
              Please tick the consent box to submit your assessment.
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-brand-teal px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-teal-dark hover:shadow-md hover:-translate-y-px active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Assessment"}
          </button>
          <p className="mt-3 text-[11.5px] italic text-brand-muted">
            We'll review your submission and respond within 5 business days.
          </p>
        </div>
      </form>
    </div>
    </>
  );
}
