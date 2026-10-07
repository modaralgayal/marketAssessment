import { z } from "zod";

export const opportunitySideSchema = z.enum(["BUY", "SELL"]);
export type OpportunitySide = z.infer<typeof opportunitySideSchema>;

export const opportunityStatusSchema = z.enum(["DRAFT", "POSTED", "ARCHIVED"]);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Payload for creating / editing an opportunity card. `side` is set by the
 *  server from the owner's account role, so it is intentionally not here. */
export const opportunityCardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500),
  summary: optionalText,
  category: optionalText,
  attributes: z.record(z.unknown()).optional(),
});

export type OpportunityCardInput = z.infer<typeof opportunityCardSchema>;

export interface OpportunityCardDto {
  id: string;
  ownerAccountId: string;
  side: OpportunitySide;
  status: OpportunityStatus;
  title: string;
  summary?: string | null;
  category?: string | null;
  attributes?: unknown;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
