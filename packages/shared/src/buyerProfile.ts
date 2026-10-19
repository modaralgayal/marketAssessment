import { z } from "zod";
import type { ContactPerson } from "./customer";
import { GCC_MARKET_OPTIONS, values, optionalText } from "./submission";

export const buyerTypeSchema = z.enum(["IMPORTER_DISTRIBUTOR", "RETAILER"]);
export type BuyerType = z.infer<typeof buyerTypeSchema>;

export const buyerProfileSchema = z.object({
  buyerType: buyerTypeSchema,
  companyName: z.string().trim().min(1, "Company name is required").max(500),
  country: z.string().trim().min(1, "Country is required").max(500),
  website: optionalText,
  // ── 01 Company ──
  tradingName: optionalText,
  hqCountry: optionalText,
  hqCity: optionalText,
  operatingCountries: z.array(z.string().trim().min(1).max(200)).default([]),
  roles: z.array(z.string().trim().min(1).max(100)).default([]), // RETAILER | IMPORTER_DISTRIBUTOR
  // Categories & portfolio
  categories: z.array(z.string().trim().min(1).max(200)).default([]),
  portfolioInfo: optionalText,
  portfolioProducts: optionalText,
  privateLabel: optionalText, // "yes" | "no"
  privateLabelName: optionalText,
  privateLabelCategories: optionalText,
  // Sourcing preferences / needs
  sourcingNeeds: optionalText,
  targetMarkets: z.array(z.enum(values(GCC_MARKET_OPTIONS))).default([]),
  // ── 04 Importer & distributor profile ──
  distributionRole: optionalText,
  warehouse: optionalText,
  warehouseArrangement: optionalText,
  storage: z.array(z.string().trim().min(1).max(200)).default([]),
  vehicles: optionalText,
  vehicleArrangement: optionalText,
  channels: z.array(z.string().trim().min(1).max(200)).default([]),
  channelPercentages: z.record(z.coerce.number()).optional(),
  channelBasis: optionalText,
  salesPoints: z.number().int().nonnegative().nullable().optional(),
  salesReachMode: optionalText,
  distributionGeography: optionalText,
  expandPortfolio: optionalText, // "yes" | "no"
  expansionProducts: optionalText,
  distributionProductType: optionalText,
  // ── 05 Retailer profile ──
  retailFormats: z.array(z.string().trim().min(1).max(200)).default([]),
  storeCount: z.number().int().nonnegative().nullable().optional(),
  retailGeography: optionalText,
  purchasingStructure: optionalText, // "office" | "outsourced" | "subsidiary"
  purchasingOffice: optionalText,
  purchasingOutsourced: optionalText,
  purchasingSubsidiary: optionalText,
  purchasingSubsidiaryName: optionalText,
  retailSupply: optionalText, // "directImport" | "localSupplier" | "both"
  directImportPercent: z.number().min(0).max(100).nullable().optional(),
  localSupplierPercent: z.number().min(0).max(100).nullable().optional(),
  retailMixBasis: optionalText,
  assortmentPlan: optionalText,
  retailExpansionProducts: optionalText,
  retailProductType: optionalText,
  retailDelivery: optionalText,
  // Catch-all for deep conditional fields
  details: z.record(z.unknown()).optional(),
  // Decision-maker contact
  contactFullName: z.string().trim().min(1, "Full name is required").max(500),
  contactTitle: z.string().trim().min(1, "Title / position is required").max(500),
  contactEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(2000),
  contactPhone: optionalText,
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
});

export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;

export interface BuyerProfileDto extends BuyerProfileInput {
  id: string;
  accountId: string;
  contacts?: ContactPerson[];
  createdAt: string;
  updatedAt: string;
}
