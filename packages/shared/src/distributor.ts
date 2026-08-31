import { z } from "zod";

// ── Distributor ────────────────────────────────────────────────────────

export const distributorSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(500),
  cityRegion: z.string().trim().min(1, "City / Region is required").max(500),
  channelType: z.string().trim().min(1, "Channel / Type is required").max(500),
  sizeScale: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  website: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  phone: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
  email: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  contactPerson: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  doWeKnowThem: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  statusLastContact: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().max(3000).optional().or(z.literal("").transform(() => undefined)),
  dataTier: z.number().int().min(1).max(3).optional(),
  attributes: z.record(z.string(), z.any()).optional().default({}),
});

export type DistributorInput = z.infer<typeof distributorSchema>;

export interface DistributorDto extends DistributorInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  matchCount?: number;
  dataTier: number;
  attributes: Record<string, any>;
}

// ── Manufacturer–Distributor Match ─────────────────────────────────────

export type MatchLevel = "STRONG" | "MODERATE" | "WEAK";

export interface ManufacturerMatchDto {
  id: string;
  submissionId: string;
  distributorId: string;
  compatibilityScore: number;
  rationale: string;
  matchLevel: MatchLevel;
  createdAt: string;
  distributor: DistributorDto;
}

export interface MatchResultDto {
  matches: Array<{
    distributorId: string;
    compatibilityScore: number;
    rationale: string;
    matchLevel: MatchLevel;
  }>;
}