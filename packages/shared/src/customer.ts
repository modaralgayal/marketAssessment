import { z } from "zod";

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
  values,
  optionalText,
  type SubmissionFileDto,
} from "./submission";

// ── Customer ─────────────────────────────────────────────────────────────

export const customerStatuses = ["QUALIFYING", "ACTIVE", "INACTIVE", "WON", "LOST"] as const;
export type CustomerStatus = (typeof customerStatuses)[number];

// Bucketing used by the admin "Customers" tab (Customers / Potential / Other).
export const customerCategories = ["CUSTOMER", "POTENTIAL", "OTHER"] as const;
export type CustomerCategory = (typeof customerCategories)[number];

// Section 1 - Company Profile
const companyName = z.string().trim().min(1, "Company name is required").max(500);
const country = z.string().trim().min(1, "Country is required").max(500);
const website = optionalText;
const industryCategory = z.string().trim().min(1, "Industry / category is required").max(500);
const annualRevenue = z.enum(values(REVENUE_OPTIONS));
const annualRevenueCustom = optionalText;
const yearsInBusiness = optionalText;
const currentExportMarkets = optionalText;

// Section 2 - Products and Operations
const halalCert = z.enum(values(YES_NO_UNSURE_OPTIONS));
const sfdaStatus = z.enum(values(SFDA_OPTIONS)).optional();
const frozenStorage = z.enum(values(FROZEN_STORAGE_OPTIONS));
const shelfLife = z.enum(values(SHELF_LIFE_OPTIONS));
const otherCerts = z.array(z.enum(values(OTHER_CERT_OPTIONS))).default([]);
const otherCertsCustom = optionalText;
const labelLanguages = optionalText;
const productAdaptability = z.enum(values(ADAPTABILITY_OPTIONS));
const brandApproach = z.enum(values(BRAND_APPROACH_OPTIONS));
const leadTimes = optionalText;

// Section 3 - Target Market
const gccCurrentlyActive = z.boolean();
const currentGccMarkets = z.array(z.enum(values(GCC_MARKET_OPTIONS))).default([]);
const gccSituation = optionalText;
const targetMarketPotential = z.enum(values(TARGET_POTENTIAL_OPTIONS)).optional();
const targetMarketPotentialOther = optionalText;
const salesChannels = z.array(z.enum(values(SALES_CHANNEL_OPTIONS))).default([]);
const channelStrategy = optionalText;

// Section 4 - Operational Readiness
const moq = optionalText;
const exportContact = z.boolean().optional();
const productionCapacity = z.enum(values(CAPACITY_OPTIONS));

// Section 5 - Decision-Maker Contact
const contactFullName = z.string().trim().min(1, "Full name is required").max(500);
const contactTitle = z.string().trim().min(1, "Title / position is required").max(500);
const contactEmail = z.string().trim().min(1, "Email is required").email("Enter a valid email").max(2000);
const contactPhone = optionalText;
const anythingElse = optionalText;

export const customerSchema = z.object({
  // Section 1 - Company Profile
  companyName,
  country,
  website,
  industryCategory,
  annualRevenue,
  annualRevenueCustom,
  yearsInBusiness,
  currentExportMarkets,

  // Section 2 - Products and Operations
  halalCert,
  sfdaStatus,
  frozenStorage,
  shelfLife,
  otherCerts,
  otherCertsCustom,
  labelLanguages,
  productAdaptability,
  brandApproach,
  leadTimes,

  // Section 3 - Target Market
  gccCurrentlyActive,
  currentGccMarkets,
  gccSituation,
  targetMarketPotential,
  targetMarketPotentialOther,
  salesChannels,
  channelStrategy,

  // Section 4 - Operational Readiness
  moq,
  exportContact,
  productionCapacity,

  // Section 5 - Decision-Maker Contact
  contactFullName,
  contactTitle,
  contactEmail,
  contactPhone,
  anythingElse,

  // Additional fields
  onboardingDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
  customerStatus: z.enum(customerStatuses).optional(),
  notes: optionalText,
});

export type CustomerInput = z.infer<typeof customerSchema>;

export interface CustomerDto extends Omit<CustomerInput, "onboardingDate"> {
  id: string;
  submissionId: string;
  onboardingDate: string;
  customerStatus: CustomerStatus;
  category: CustomerCategory;
  files: SubmissionFileDto[];
  createdAt: string;
  updatedAt: string;
}
