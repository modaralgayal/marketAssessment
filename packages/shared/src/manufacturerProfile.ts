import { z } from "zod";
import type { ContactPerson } from "./customer";
import {
  YES_NO_UNSURE_OPTIONS,
  OTHER_CERT_OPTIONS,
  GCC_MARKET_OPTIONS,
  SHELF_LIFE_OPTIONS,
  TARGET_POTENTIAL_OPTIONS,
  SFDA_OPTIONS,
  values,
  optionalText,
} from "./submission";

export const manufacturerProfileSchema = z.object({
  // Section 1 - Company Profile
  companyName: z.string().trim().min(1, "Company name is required").max(500),
  country: z.string().trim().min(1, "Country is required").max(500),
  website: optionalText,
  industryCategory: z.string().trim().min(1, "Industry / category is required").max(500),
  annualRevenue: optionalText,
  annualRevenueCustom: optionalText,
  yearsInBusiness: optionalText,
  currentExportMarkets: optionalText,

  // Section 2 - Products and Operations
  halalCert: z.enum(values(YES_NO_UNSURE_OPTIONS)).optional(),
  sfdaStatus: z.enum(values(SFDA_OPTIONS)).optional(),
  frozenStorage: optionalText,
  shelfLife: z.enum(values(SHELF_LIFE_OPTIONS)).optional(),
  otherCerts: z.array(z.enum(values(OTHER_CERT_OPTIONS))).default([]),
  otherCertsCustom: optionalText,
  labelLanguages: optionalText,
  productAdaptability: optionalText,
  brandApproach: optionalText,
  leadTimes: optionalText,

  // Section 3 - Target Market
  gccCurrentlyActive: z.boolean().optional(),
  currentGccMarkets: z.array(z.enum(values(GCC_MARKET_OPTIONS))).default([]),
  gccSituation: optionalText,
  targetMarketPotential: z.enum(values(TARGET_POTENTIAL_OPTIONS)).optional(),
  targetMarketPotentialOther: optionalText,
  /** Primary target export market (the reference prototype's required "Target export market" field). */
  targetExportMarket: optionalText,
  salesChannels: z.array(z.string().trim().min(1).max(200)).default([]),
  channelStrategy: optionalText,

  // Section 4 - Operational Readiness
  moq: optionalText,
  exportContact: z.boolean().optional(),
  productionCapacity: optionalText,

  // Section 5 - Decision-Maker Contact
  contactFullName: z.string().trim().min(1, "Full name is required").max(500),
  contactTitle: z.string().trim().min(1, "Title / position is required").max(500),
  contactEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(2000),
  contactPhone: optionalText,
  anythingElse: optionalText,
  /** Export-contact details shown when the dedicated contact is a different person (reference prototype). */
  exportContactDetails: optionalText,

  // Profile (self-service) fields
  contacts: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Contact name is required").max(500),
        position: optionalText,
        phone: optionalText,
        email: z
          .string()
          .trim()
          .max(2000)
          .optional()
          .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email"),
      }),
    )
    .optional(),
  productCategory: optionalText,
  companyInfo: optionalText,

  // Expanded profile (reference prototype)
  exportCount: z.number().int().nonnegative().optional(),
  topMarkets: optionalText,
  knownFor: optionalText,
  pictures: optionalText,
  logistics: optionalText,
  usp: optionalText,
  branding: optionalText, // "brandLed" | "shared" | "tradeSupport" | "priceLed"
  privateLabel: optionalText, // "yes" | "no" | "considering"
  certs: z.array(z.string().trim().min(1).max(100)).default([]), // Halal | BRCGS | IFS | FSSC | ISO | HACCP | Organic | Other | None
  catalogueCoverage: z.record(z.boolean()).optional(), // { products, prices, ... }

  // Public profile (visible to buyers on the marketplace + profile page)
  publicDescription: optionalText,
});

export type ManufacturerProfileInput = z.infer<typeof manufacturerProfileSchema>;

/** A single catalogue / price-list document attached to the manufacturer profile.
 *  `kind` is "pdf" (an uploaded file, fetched via a signed URL) or "link". */
export interface ManufacturerFileInfo {
  id: string;
  manufacturerProfileId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  kind: string; // "pdf" | "link"
  url?: string | null;
  createdAt: string;
}

export interface ManufacturerProfileDto extends ManufacturerProfileInput {
  id: string;
  accountId: string;
  contacts?: ContactPerson[];
  catalogueFileId?: string | null;
  /** Uploaded catalogue / price-list documents (PDFs + links). */
  files?: ManufacturerFileInfo[];
  /** Short-lived signed URL for the profile logo/image (null if none). */
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
