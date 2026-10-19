import { z } from "zod";

export const sourcingInquiryStatusSchema = z.enum(["DRAFT", "OPEN", "PAUSED", "CLOSED"]);
export type SourcingInquiryStatus = z.infer<typeof sourcingInquiryStatusSchema>;

export const productTypeSchema = z.enum(["BRANDED", "PRIVATE_LABEL", "EITHER"]);
export type ProductType = z.infer<typeof productTypeSchema>;

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Payload for creating / editing a buyer sourcing inquiry (buying brief). */
export const sourcingInquirySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500),
  products: z.string().trim().min(1, "Products are required").max(4000),
  productType: productTypeSchema.default("EITHER"),
  market: optionalText,
  channels: z.array(z.string().trim().min(1).max(200)).default([]),
  priceTier: optionalText,
  targetPrice: optionalText,
  timeframe: optionalText,
  quantity: optionalText,
  essential: optionalText,
  negotiable: optionalText,
  status: sourcingInquiryStatusSchema.default("DRAFT"),
  attributes: z.record(z.unknown()).optional(),
});

export type SourcingInquiryInput = z.infer<typeof sourcingInquirySchema>;

export interface SourcingInquiryBriefDto {
  id: string;
  inquiryId: string;
  storageKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface SourcingInquiryDto {
  id: string;
  accountId: string;
  title: string;
  products: string;
  productType: ProductType;
  market?: string | null;
  channels: string[];
  priceTier?: string | null;
  targetPrice?: string | null;
  timeframe?: string | null;
  quantity?: string | null;
  essential?: string | null;
  negotiable?: string | null;
  status: SourcingInquiryStatus;
  attributes?: unknown;
  briefs: SourcingInquiryBriefDto[];
  createdAt: string;
  updatedAt: string;
}
