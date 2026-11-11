import { z } from "zod";

export const opportunitySideSchema = z.enum(["BUY", "SELL"]);
export type OpportunitySide = z.infer<typeof opportunitySideSchema>;

// Lifecycle of a card:
//  DRAFT       — authoring, not visible to anyone else
//  IN_REVIEW   — sent to the administrator for review (NOT published to buyers)
//  POSTED      — published, visible to buyers + the matchmaking agent
//  PAUSED      — hidden from buyers, resumable
//  ARCHIVED    — taken down / closed (legacy "Closed")
export const opportunityStatusSchema = z.enum(["DRAFT", "POSTED", "ARCHIVED", "IN_REVIEW", "PAUSED"]);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

/** Editor-facing status labels (the `status` field the frontend sends).
 *  "Delete" is a destructive action, not a persisted status. */
export const opportunityStatusLabelSchema = z.enum([
  "Draft",
  "Internal review",
  "Publish",
  "Pause",
]);
export type OpportunityStatusLabel = z.infer<typeof opportunityStatusLabelSchema>;

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal("").transform(() => undefined));

/** A reference to a catalogue item (a profile attachment) or a card-specific
 *  commercial attachment. `kind` distinguishes a profile PDF/link (`sources`)
 *  from a card-specific price list / terms upload (`assets`). `url` is set for
 *  link-type entries; uploaded files are opened via a signed URL keyed by `id`. */
export const opportunityRefSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(300),
  kind: z.enum(["pdf", "link"]).optional(),
  url: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
});
export type OpportunityRef = z.infer<typeof opportunityRefSchema>;

/** Payload for creating / editing an opportunity card. `side` and `version` are
 *  managed by the server, so they are intentionally not here. */
export const opportunityCardSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500),
  summary: optionalText,
  category: optionalText,
  territory: optionalText,
  channels: z.array(z.string().trim().min(1).max(200)).default([]),
  // Structured offer fields (mirror the model opportunity-card prototype).
  partner: optionalText,
  timing: optionalText,
  objective: optionalText,
  moq: optionalText,
  payment: optionalText,
  delivery: optionalText,
  rights: optionalText,
  validUntil: optionalText,
  support: optionalText,
  sources: z.array(opportunityRefSchema).optional(),
  assets: z.array(opportunityRefSchema).optional(),
  // Card status uses the editor's labels; the server maps them to the internal
  // DRAFT / IN_REVIEW / POSTED / PAUSED enum (see api/src/routes/opportunityCards.ts).
  // "Delete" is handled as a separate destructive action, not a status value.
  status: opportunityStatusLabelSchema.optional(),
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
  territory?: string | null;
  channels: string[];
  // Structured offer fields.
  partner?: string | null;
  timing?: string | null;
  objective?: string | null;
  moq?: string | null;
  payment?: string | null;
  delivery?: string | null;
  rights?: string | null;
  validUntil?: string | null;
  support?: string | null;
  version: number;
  sources?: OpportunityRef[] | null;
  assets?: OpportunityRef[] | null;
  attributes?: unknown;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Buyer interest / engagement on a card ────────────────────────────────

export const opportunityInteractionStatusSchema = z.enum([
  "NEW",
  "VIEWED",
  "SAVED",
  "INTERESTED",
  "DECLINED",
  "REFERRED",
]);
export type OpportunityInteractionStatus = z.infer<typeof opportunityInteractionStatusSchema>;

export interface OpportunityInteractionDto {
  cardId: string;
  accountId: string;
  status: OpportunityInteractionStatus;
  linkedInquiryId?: string | null;
  referralNote?: string | null;
  lastActivityAt?: string | null;
}

/** A marketplace card enriched with the caller's own interaction state. */
export interface MarketCardDto extends OpportunityCardDto {
  interaction?: OpportunityInteractionDto | null;
  owner?: {
    companyName: string;
    country?: string | null;
    /** Short-lived signed URL to the owner's logo/profile image (may be null). */
    logoUrl?: string | null;
    /** Public, buyer-visible description of the owner. */
    publicDescription?: string | null;
    /** Account id — used to link to the owner's public profile page. */
    accountId?: string | null;
  } | null;
}

export interface EngagementRowDto {
  cardId: string;
  cardTitle: string;
  buyerAccountId: string;
  buyerName: string;
  buyerEmail: string;
  status: OpportunityInteractionStatus;
  linkedInquiryId?: string | null;
  lastActivityAt?: string | null;
}

