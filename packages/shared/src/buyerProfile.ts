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
  // Categories & portfolio
  categories: z.array(z.string().trim().min(1).max(200)).default([]),
  portfolioInfo: optionalText,
  // Sourcing preferences / needs
  sourcingNeeds: optionalText,
  targetMarkets: z.array(z.enum(values(GCC_MARKET_OPTIONS))).default([]),
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
