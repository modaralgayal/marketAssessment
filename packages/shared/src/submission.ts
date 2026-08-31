import { z } from "zod";
import type { ManufacturerMatchDto } from "./distributor";

/**
 * Option catalogues. The string literals here are the canonical values used
 * end-to-end: React form `value` attributes, the Zod schema below, and the
 * Prisma enums (where applicable) all share them, so no mapping layer is needed.
 * Each entry carries a human label for rendering in the UI.
 *
 * These are kept in sync with `assessment-criteria/gcc_market_entry_framework.json`
 * (the authoritative assessment definition).
 */
export const REVENUE_OPTIONS = [
  { value: "R1_5M", label: "€1M – €5M" },
  { value: "R5_20M", label: "€5M – €20M" },
  { value: "R20_50M", label: "€20M – €50M" },
  { value: "R50_100M", label: "€50M – €100M" },
  { value: "R100_200M", label: "€100M – €200M" },
  { value: "R200M_PLUS", label: "€200M+" },
  { value: "R300M_PLUS", label: "€300M+" },
  { value: "R400M_PLUS", label: "€400M+" },
  { value: "R500M_1B", label: "€500M – €1B" },
  { value: "R1B_PLUS", label: "€1B+" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export const YES_NO_UNSURE_OPTIONS = [
  { value: "YES", label: "Yes – certified" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "NO", label: "No" },
  { value: "UNSURE", label: "Not sure" },
] as const;

export const OTHER_CERT_OPTIONS = [
  { value: "BRCGS", label: "BRCGS Food Safety" },
  { value: "IFS", label: "IFS Food" },
  { value: "FSSC", label: "FSSC 22000 / ISO 22000" },
  { value: "HACCP", label: "HACCP (externally audited)" },
  { value: "GLOBALGAP", label: "GLOBALG.A.P." },
  { value: "EU_ORGANIC", label: "EU Organic Certification" },
  { value: "OTHER_ORGANIC", label: "Other organic certifications, e.g. NOP, JAS" },
  { value: "SMETA", label: "SMETA / Sedex / SA8000" },
  { value: "ISO14001", label: "ISO 14001" },
  { value: "KOSHER", label: "Kosher" },
  { value: "NONE", label: "None" },
  { value: "CUSTOM", label: "Custom" },
] as const;

/** Markets a company is currently active in (GCC availability = yes). */
export const GCC_MARKET_OPTIONS = [
  { value: "KSA", label: "Saudi Arabia (KSA)" },
  { value: "UAE", label: "United Arab Emirates (UAE)" },
  { value: "KUWAIT", label: "Kuwait" },
  { value: "QATAR", label: "Qatar" },
  { value: "BAHRAIN", label: "Bahrain" },
  { value: "OMAN", label: "Oman" },
] as const;

export const SALES_CHANNEL_OPTIONS = [
  { value: "MODERN_TRADE", label: "Modern trade / Retail" },
  { value: "GENERAL_TRADE", label: "General trade" },
  { value: "DISCOUNT", label: "Discount stores" },
  { value: "FOODSERVICE", label: "Food service" },
  { value: "HORECA", label: "HoReCa" },
  { value: "ECOMMERCE", label: "E-commerce" },
] as const;

export const FROZEN_STORAGE_OPTIONS = [
  { value: "YES", label: "Yes – Frozen products" },
  { value: "NO", label: "No – Ambient/chilled products" },
] as const;

export const SHELF_LIFE_OPTIONS = [
  { value: "SHORT", label: "Short shelf life (under 6 months)" },
  { value: "MEDIUM", label: "Medium shelf life (6–11 months)" },
  { value: "LONG", label: "Long shelf life (12 months or more)" },
] as const;

export const BRAND_APPROACH_OPTIONS = [
  { value: "BRAND_LED", label: "Brand-led approach" },
  { value: "SHARED", label: "Shared-investment approach" },
  { value: "TRADE_SUPPORT", label: "Trade-support approach" },
  { value: "PRICE_LED", label: "Price-led approach" },
] as const;

/** Target market potential when the company is NOT yet active in the GCC. */
export const TARGET_POTENTIAL_OPTIONS = [
  { value: "KSA", label: "Saudi Arabia" },
  { value: "UAE", label: "United Arab Emirates" },
  { value: "BOTH", label: "Both" },
  { value: "UNSURE", label: "I don't know yet" },
  { value: "OTHER", label: "Other GCC markets" },
] as const;

export const CAPACITY_OPTIONS = [
  { value: "YES", label: "Yes – we have available capacity" },
  { value: "PARTIAL", label: "Partially – subject to demand planning" },
  { value: "NO", label: "Not at this time" },
] as const;

export const SFDA_OPTIONS = [
  { value: "REGISTERED", label: "Registered" },
  { value: "IN_PROCESS", label: "In process" },
  { value: "NOT_YET", label: "Not yet" },
  { value: "UNSURE", label: "Not sure" },
] as const;

export const ADAPTABILITY_OPTIONS = [
  { value: "YES", label: "Yes – we're open to it" },
  { value: "PARTIAL", label: "Partially – depending on what's required" },
  { value: "NO", label: "No – our product is fixed" },
] as const;

const values = <T extends ReadonlyArray<{ value: string }>>(opts: T) =>
  opts.map((o) => o.value) as unknown as [T[number]["value"], ...T[number]["value"][]];

const optionalText = z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined));
const requiredText = (field: string) => z.string().trim().min(1, `${field} is required`).max(2000);

// Re-export for customer.ts to use
export { values, optionalText };

export const submissionSchema = z
  .object({
    // Section 1 — Company Profile
    companyName: requiredText("Company name"),
    country: requiredText("Country"),
    website: requiredText("Website"),
    industryCategory: requiredText("Industry / product category"),
    annualRevenue: z.enum(values(REVENUE_OPTIONS)),
    annualRevenueCustom: optionalText,
    yearsInBusiness: requiredText("Years in business"),
    currentExportMarkets: requiredText("Current export markets"),

    // Section 2 — Products and Operations
    halalCert: z.enum(values(YES_NO_UNSURE_OPTIONS)),
    sfdaStatus: z.enum(values(SFDA_OPTIONS)),
    frozenStorage: z.enum(values(FROZEN_STORAGE_OPTIONS)),
    shelfLife: z.enum(values(SHELF_LIFE_OPTIONS)),
    otherCerts: z.array(z.enum(values(OTHER_CERT_OPTIONS))).default([]),
    otherCertsCustom: optionalText,
    labelLanguages: requiredText("Label languages"),
    productAdaptability: z.enum(values(ADAPTABILITY_OPTIONS)),
    brandApproach: z.enum(values(BRAND_APPROACH_OPTIONS)),
    leadTimes: requiredText("Lead times"),

    // Section 3 — Target Market
    gccCurrentlyActive: z.boolean(),
    currentGccMarkets: z.array(z.enum(values(GCC_MARKET_OPTIONS))).default([]),
    gccSituation: optionalText,
    targetMarketPotential: z.enum(values(TARGET_POTENTIAL_OPTIONS)).optional(),
    targetMarketPotentialOther: optionalText,
    salesChannels: z.array(z.enum(values(SALES_CHANNEL_OPTIONS))).default([]),
    channelStrategy: optionalText,

    // Section 4 — Operational Readiness
    moq: requiredText("Minimum order quantity"),
    exportContact: z.boolean(),
    productionCapacity: z.enum(values(CAPACITY_OPTIONS)),

    // Section 5 — Decision-Maker Contact
    contactFullName: requiredText("Full name"),
    contactTitle: requiredText("Title / position"),
    contactEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    contactPhone: requiredText("Phone number"),
    anythingElse: requiredText("Additional information"),
  })
  // Conditional requirements: fields that are only shown in the UI under certain
  // conditions must only be required when they are actually visible.
  .superRefine((val, ctx) => {
    if (val.annualRevenue === "CUSTOM" && !val.annualRevenueCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["annualRevenueCustom"],
        message: "Please specify your annual revenue",
      });
    }
    if (val.otherCerts?.includes("CUSTOM") && !val.otherCertsCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherCertsCustom"],
        message: "Please specify the certification",
      });
    }
    if (val.gccCurrentlyActive === true && !val.gccSituation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gccSituation"],
        message: "Please describe your current GCC situation",
      });
    }
    if (val.gccCurrentlyActive === false && !val.targetMarketPotential) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetMarketPotential"],
        message: "Please select your target market potential",
      });
    }
    if (val.targetMarketPotential === "OTHER" && !val.targetMarketPotentialOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetMarketPotentialOther"],
        message: "Please specify the market",
      });
    }
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;

/** File upload constraints (validated server-side; files don't pass through Zod JSON). */
export const FILE_CONSTRAINTS = {
  maxBytes: 100 * 1024 * 1024,
  maxFiles: 10,
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions: [".pdf", ".xls", ".xlsx", ".csv", ".doc", ".docx", ".ppt", ".pptx", ".zip"],
} as const;

/** Shape returned by the admin API for a file. */
export interface SubmissionFileDto {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

/** Shape returned by the admin API for a submission. */
export interface SubmissionDto extends SubmissionInput {
  id: string;
  createdAt: string;
  /** Assessment score (0-100) */
  score?: number;
  /** Explanation of the score */
  explanation?: string;
  /** Decision: GO, CONDITIONAL, REVISIT, or NO-GO */
  decision?: "GO" | "CONDITIONAL" | "REVISIT" | "NO-GO";
  /** When the evaluation was last performed */
  evaluatedAt?: string;
  files: SubmissionFileDto[];
  /** Number of distributor matches (populated in list view) */
  matchCount?: number;
  /** Distributor matches (only populated when requested) */
  matches?: ManufacturerMatchDto[];
  /** Extracted structured data from catalogue files */
  catalogueData?: CatalogueExtractedData;
  /** When catalogue extraction was last run */
  catalogueExtractedAt?: string;
}

/** Structured output from catalogue extraction. */
export interface CatalogueExtractedData {
  productNames?: string[];
  productCategories?: string[];
  certifications?: string[];
  exWorksPriceRange?: string;
  shelfLife?: string;
  packagingInfo?: string;
  companyDescription?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  keyFindings?: string[];
  /** Additional data fields not matching the known schema */
  additionalFields?: Array<{
    key: string;
    value: string;
  }>;
}
