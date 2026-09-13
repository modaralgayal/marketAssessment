import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { COUNTRIES } from "../landing/countries";
import { submitAssessment, validateInvite } from "../../lib/api";
import {
  Section,
  Field,
  TextInput,
  TextArea,
  SelectField,
  MultiSelectDropdown,
} from "./fields";
import { CoverHeader, SuccessScreen, type FormMode } from "./Chrome";
import SiteNav from "../landing/SiteNav";

// Revenue is capped at €300M+ for the form: the higher brackets and the free-text
// "Custom" option are dropped from the dropdown (the schema enum still allows them).
const REVENUE_OPTIONS_CAPPED = REVENUE_OPTIONS.filter(
  (o) => !["R400M_PLUS", "R500M_1B", "R1B_PLUS", "CUSTOM"].includes(o.value),
) as unknown as ReadonlyArray<{ value: string; label: string }>;

const COUNTRY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = COUNTRIES.map((c) => ({
  value: c,
  label: c,
}));

const YES_NO: ReadonlyArray<{ value: boolean; label: string }> = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];

// Human-readable names for each schema field, used to name the missing items
// in the "Please complete the following" banner so the user knows what's empty
// even when the offending field is scrolled out of view.
const FIELD_LABELS: Record<string, string> = {
  companyName: "Company name",
  country: "Country",
  website: "Website",
  industryCategory: "Industry / product category",
  annualRevenue: "Annual revenue",
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

/**
 * TEMP DEV HELPER — sample payload for the "Autofill (test)" button so the form
 * can be submitted without manual entry. Remove this object and the button once
 * testing is done.
 */
const SAMPLE_SUBMISSION: SubmissionInput = {
  companyName: "Nordic Berries Oy",
  country: "Finland",
  website: "https://nordicberries.example.com",
  industryCategory: "Beverages",
  annualRevenue: "R5_20M",
  annualRevenueCustom: "",
  yearsInBusiness: "12 years",
  currentExportMarkets: "Sweden, Germany, Poland",
  halalCert: "NO",
  sfdaStatus: "NOT_YET",
  frozenStorage: "NO",
  shelfLife: "MEDIUM",
  otherCerts: ["BRCGS", "HACCP"],
  otherCertsCustom: "",
  labelLanguages: "Finnish, English, Swedish",
  productAdaptability: "YES",
  brandApproach: "SHARED",
  leadTimes: "3–4 weeks from order confirmation",
  gccCurrentlyActive: false,
  currentGccMarkets: [],
  gccSituation: "",
  targetMarketPotential: "KSA",
  targetMarketPotentialOther: "",
  salesChannels: ["MODERN_TRADE", "ECOMMERCE"],
  channelStrategy: "Prioritise modern trade in KSA via a national distributor.",
  moq: "1 pallet",
  exportContact: true,
  productionCapacity: "YES",
  contactFullName: "Test User",
  contactTitle: "Export Director",
  contactEmail: "test@example.com",
  contactPhone: "+358 40 123 4567",
  anythingElse: "Test submission autofilled for QA.",
};

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-1.5 text-xs font-semibold transition ${
    active
      ? "bg-brand-teal text-white"
      : "border border-brand-line text-brand-ink hover:border-brand-teal hover:text-brand-teal"
  }`;

export default function FormPage() {
  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
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

  const [params] = useSearchParams();
  const inviteToken = params.get("invite") ?? "";
  const [gate, setGate] = useState<"loading" | "open" | "denied">("loading");
  const [mode, setMode] = useState<FormMode>("assessment");

  useEffect(() => {
    let cancelled = false;
    if (!inviteToken) {
      setGate("denied");
      return;
    }
    validateInvite(inviteToken)
      .then((r) => {
        if (!cancelled) {
          setMode(r.valid && r.purpose === "ONBOARDING" ? "onboarding" : "assessment");
          setGate(r.valid ? "open" : "denied");
        }
      })
      .catch(() => {
        if (!cancelled) setGate("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const consentRef = useRef<HTMLLabelElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [blockReasons, setBlockReasons] = useState<string[]>([]);
  const [catalogueMode, setCatalogueMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");

  /**
   * Scrolls to the uppermost field that failed validation and, if it contains a
   * focusable control, focuses it. Runs after React re-renders the error text.
   */
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const errs = Array.from(document.querySelectorAll<HTMLElement>('[data-error="true"]'));
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
   * a registered field is invalid, so the file/link and consent checks (which
   * live outside RHF) must run HERE too.
   */
  const onInvalid = (errs: FieldErrors<SubmissionInput>) => {
    const reasons: string[] = [...missingFromErrors(errs)];
    if (files.length === 0 && !linkUrl.trim()) {
      setFileError("Attach a catalogue file or provide a link.");
      reasons.push("Attach your export catalogue / price list or provide a link");
    }
    if (!consent) {
      setConsentError(true);
      reasons.push("Accept the Privacy Policy (AI processing consent)");
    }
    setBlockReasons(reasons);
    scrollToFirstError();
  };

  const gccCurrentlyActive = watch("gccCurrentlyActive");
  const otherCerts = watch("otherCerts");
  const targetMarketPotential = watch("targetMarketPotential");

  const switchCatalogueMode = (m: "file" | "link") => {
    setCatalogueMode(m);
    if (m === "file") setLinkUrl("");
    else setFiles([]);
    setFileError(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFileError(null);
    if (picked.length > FILE_CONSTRAINTS.maxFiles) {
      setFileError(`Please attach at most ${FILE_CONSTRAINTS.maxFiles} files.`);
      return;
    }
    const tooBig = picked.find((f) => f.size > FILE_CONSTRAINTS.maxBytes);
    if (tooBig) {
      setFileError(`"${tooBig.name}" exceeds the 100 MB limit.`);
      return;
    }
    setFiles(picked);
    setBlockReasons([]);
  };

  const onSubmit = async (data: SubmissionInput) => {
    setSubmitError(null);
    const reasons: string[] = [];
    const link = catalogueMode === "link" ? linkUrl.trim() : "";
    if (files.length === 0 && !link) {
      setFileError("Attach a catalogue file or provide a link.");
      reasons.push("Attach your export catalogue / price list or provide a link");
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
      // One public endpoint handles both: the server routes onboarding invites
      // to the Potential Customers bucket and assessment invites to Submissions.
      await submitAssessment({ ...data, catalogueLink: link || undefined }, files, inviteToken);
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * TEMP DEV HELPER — fills every field with SAMPLE_SUBMISSION, attaches a tiny
   * dummy PDF (so the required-file check passes), and accepts consent, so the
   * form can be submitted instantly. Remove together with the button when done.
   */
  const handleAutofill = () => {
    reset(SAMPLE_SUBMISSION);
    switchCatalogueMode("file");
    setFiles([
      new File(
        ["Sample catalogue content for testing purposes only."],
        "sample-catalogue.pdf",
        { type: "application/pdf" },
      ),
    ]);
    setConsent(true);
    setConsentError(false);
    setFileError(null);
    setBlockReasons([]);
    setSubmitError(null);
  };

  if (done)
    return (
      <>
        <SiteNav />
        <SuccessScreen mode={mode} />
      </>
    );

  if (gate === "loading")
    return (
      <>
        <SiteNav />
        <div className="p-16 text-center text-sm text-brand-muted">Checking your invite…</div>
      </>
    );

  if (gate === "denied") return <InviteDenied />;

  return (
    <>
      <SiteNav />
      <div className="w-full bg-brand-bg-alt">
        <CoverHeader mode={mode} />

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6 px-8 py-8 pb-16 sm:px-16">
          {/* ── 1. Company Profile ── */}
          <Section num={1} title="Company Profile" sub="Basic information about your business">
            <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
              <Field label="Company Name" required error={errors.companyName?.message}>
                <TextInput name="companyName" register={register} placeholder="Legal company name" />
              </Field>
              <Field label="Country" required error={errors.country?.message}>
                <SelectField
                  name="country"
                  control={control}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select your country"
                  searchable
                />
              </Field>
            </div>
            <Field label="Website" required error={errors.website?.message}>
              <TextInput name="website" register={register} placeholder="www.yourcompany.com" />
            </Field>
            <Field
              label="Industry / Product Category"
              required
              note="e.g. Dairy, Beverages, Bakery, Confectionery"
              error={errors.industryCategory?.message}
            >
              <TextInput name="industryCategory" register={register} placeholder="Describe your category" />
            </Field>
            <Field label="Annual Revenue" required error={errors.annualRevenue?.message}>
              <SelectField
                name="annualRevenue"
                control={control}
                options={REVENUE_OPTIONS_CAPPED}
                placeholder="Select a range"
              />
            </Field>
            <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
              <Field label="Years in Business" required error={errors.yearsInBusiness?.message}>
                <TextInput name="yearsInBusiness" register={register} placeholder="e.g. 12 years" />
              </Field>
              <Field label="Current Export Markets" required error={errors.currentExportMarkets?.message}>
                <TextInput
                  name="currentExportMarkets"
                  register={register}
                  placeholder="e.g. Sweden, Germany, Poland"
                />
              </Field>
            </div>
          </Section>

          {/* ── 2. Products and Operations ── */}
          <Section num={2} title="Products and Operations" sub="What you're bringing to market">
            <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
              <Field
                label="Shelf Life"
                required
                note="Typical shelf life of most products"
                error={errors.shelfLife?.message}
              >
                <SelectField
                  name="shelfLife"
                  control={control}
                  options={SHELF_LIFE_OPTIONS}
                  placeholder="Select shelf life"
                />
              </Field>
              <Field
                label="Frozen Storage Required?"
                required
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
            </div>
            <Field
              label="Halal Certification"
              required
              note="Required for GCC market entry"
              error={errors.halalCert?.message}
            >
              <SelectField
                name="halalCert"
                control={control}
                options={YES_NO_UNSURE_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field
              label="SFDA or ADAFSA Product Registration"
              required
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
            <Field label="Valid Certifications" note="Select all that apply">
              <MultiSelectDropdown
                name="otherCerts"
                control={control}
                options={OTHER_CERT_OPTIONS}
                placeholder="Select certifications"
              />
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
            <Field
              label="Label Languages Currently Available"
              required
              note="Languages on your current labels"
              error={errors.labelLanguages?.message}
            >
              <TextInput name="labelLanguages" register={register} placeholder="e.g. English, Finnish" />
            </Field>
            <Field
              label="Product Adaptability"
              required
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
              required
              note="Your branding approach in new markets"
              error={errors.brandApproach?.message}
            >
              <SelectField
                name="brandApproach"
                control={control}
                options={BRAND_APPROACH_OPTIONS}
                placeholder="Select"
              />
            </Field>
            <Field label="Lead Times" required note="Order to delivery" error={errors.leadTimes?.message}>
              <TextInput name="leadTimes" register={register} placeholder="e.g. 3–4 weeks" />
            </Field>

            {/* Catalogue — document OR link */}
            <Field
              label="Export Catalogue / Price List"
              required
              note={
                mode === "onboarding"
                  ? "Upload your catalogue or paste a link so we can complete your profile."
                  : "Upload your catalogue or paste a link — we can't fully assess without it."
              }
              error={fileError ?? undefined}
            >
              <div className="rounded-md border border-brand-line bg-brand-bg-alt p-3">
                <div className="mb-3 flex gap-2">
                  <button type="button" onClick={() => switchCatalogueMode("file")} className={tabClass(catalogueMode === "file")}>
                    Upload a file
                  </button>
                  <button type="button" onClick={() => switchCatalogueMode("link")} className={tabClass(catalogueMode === "link")}>
                    Paste a link
                  </button>
                </div>
                {catalogueMode === "file" ? (
                  <>
                    <input
                      type="file"
                      multiple
                      accept={FILE_CONSTRAINTS.allowedExtensions.join(",")}
                      onChange={onFileChange}
                      className="block w-full text-[12.5px] text-brand-ink file:mr-3 file:rounded file:border-0 file:bg-brand-teal file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-teal-dark"
                    />
                    {files.length > 0 && (
                      <ul className="mt-2 text-[12px] text-brand-muted">
                        {files.map((f) => (
                          <li key={f.name}>
                            • {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setFileError(null);
                      setBlockReasons([]);
                    }}
                    placeholder="https://…"
                    className="block w-full rounded border border-brand-line bg-white px-3 py-2 text-[13px] text-brand-ink outline-none focus:border-brand-teal"
                  />
                )}
              </div>
            </Field>
          </Section>

          {/* ── 3. Target Market ── */}
          <Section num={3} title="Target Market" sub="Your GCC presence and market priorities">
            <Field
              label="Currently Active in Any GCC Market?"
              required
              error={errors.gccCurrentlyActive?.message}
            >
              <SelectField name="gccCurrentlyActive" control={control} options={YES_NO} placeholder="Select" />
            </Field>
            {gccCurrentlyActive === true && (
              <>
                <Field label="Which GCC Markets Are You Active In?">
                  <MultiSelectDropdown
                    name="currentGccMarkets"
                    control={control}
                    options={GCC_MARKET_OPTIONS}
                    placeholder="Select markets"
                  />
                </Field>
                <Field
                  label="Describe Your Current GCC Situation"
                  error={errors.gccSituation?.message}
                >
                  <TextArea
                    name="gccSituation"
                    register={register}
                    rows={3}
                    placeholder="e.g. what's working, what isn't, where's the upside"
                  />
                </Field>
              </>
            )}
            {gccCurrentlyActive === false && (
              <Field
                label="Which Market Shows the Greatest Potential?"
                required
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
              <Field label="If Other, Please Specify" error={errors.targetMarketPotentialOther?.message}>
                <TextInput name="targetMarketPotentialOther" register={register} placeholder="e.g. Kuwait, Qatar" />
              </Field>
            )}
            <Field label="Sales Channels of Interest" note="Select all that apply">
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
                placeholder="e.g. Which channels matter most, and why?"
              />
            </Field>
          </Section>

          {/* ── 4. Operational Readiness ── */}
          <Section num={4} title="Operational Readiness" sub="Your capacity to serve a new market">
            <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
              <Field label="Minimum Order Quantity (MOQ)" required note="For a first export order" error={errors.moq?.message}>
                <TextInput name="moq" register={register} placeholder="e.g. 1 pallet" />
              </Field>
              <Field
                label="Dedicated Export Contact?"
                required
                note="An export manager or point of contact"
                error={errors.exportContact?.message}
              >
                <SelectField name="exportContact" control={control} options={YES_NO} placeholder="Select" />
              </Field>
            </div>
            <Field
              label="Can You Dedicate Production Capacity to a New Export Market?"
              required
              error={errors.productionCapacity?.message}
            >
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
            </div>
            <div className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
              <Field label="Email Address" required error={errors.contactEmail?.message}>
                <TextInput name="contactEmail" register={register} type="email" placeholder="your@company.com" />
              </Field>
              <Field label="Phone Number" required error={errors.contactPhone?.message}>
                <TextInput name="contactPhone" register={register} type="tel" placeholder="+358 XX XXX XXXX" />
              </Field>
            </div>
            <Field
              label="Anything Else?"
              required
              note="Any context that helps — past exports, GCC ambitions, challenges. More detail means a sharper assessment."
              error={errors.anythingElse?.message}
            >
              <TextArea
                name="anythingElse"
                register={register}
                rows={4}
                placeholder="Anything else that helps us understand your products or ambitions."
              />
            </Field>
          </Section>

          {/* Submit */}
          <section className="rounded-xl border border-brand-line bg-white p-5 shadow-sm sm:p-6">
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

            {/* TEMP DEV: quick autofill for testing — remove when not needed */}
            <button
              type="button"
              onClick={handleAutofill}
              title="Fills the form with sample data and a dummy file so you can submit instantly"
              className="mb-3 rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              ⚡ Autofill (test)
            </button>
            <label
              ref={consentRef}
              className={`mt-1 flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-3 ${
                consentError ? "border-red-300 bg-red-50/40" : "border-brand-line bg-white"
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
              {submitting ? "Submitting…" : mode === "onboarding" ? "Complete Onboarding" : "Submit Assessment"}
            </button>
            <p className="mt-3 text-[11.5px] italic text-brand-muted">
              {mode === "onboarding"
                ? "Your profile will be saved to our system."
                : "We'll review your submission and respond within 5 business days."}
            </p>
          </section>
        </form>
      </div>
    </>
  );
}

/** Shown when /assessment is reached without a valid, unused invite token. */
function InviteDenied() {
  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-bg-alt text-xl text-brand-teal">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-brand-ink">This assessment is invite-only</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brand-muted">
          The market-entry assessment is available by invitation. Request a report and we'll
          send you a private link to access the form.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/request-report"
            className="rounded-full bg-brand-teal px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-teal-dark"
          >
            Request a Report
          </Link>
          <Link
            to="/"
            className="rounded-full border border-brand-line px-6 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-teal hover:text-brand-teal"
          >
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}
