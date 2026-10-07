import { z } from "zod";

export const matchSuggestionStatusSchema = z.enum([
  "NEW",
  "REVIEWED",
  "DISMISSED",
  "ACCEPTED",
]);
export type MatchSuggestionStatus = z.infer<typeof matchSuggestionStatusSchema>;

/** Written by the matchmaking agent (server-to-server, `x-api-key` auth). */
export const matchSuggestionSchema = z.object({
  cardAId: z.string().min(1),
  cardBId: z.string().min(1),
  score: z.number().min(0).max(1),
  rationale: z.string().trim().max(5000).optional(),
  status: matchSuggestionStatusSchema.optional(),
});
export type MatchSuggestionInput = z.infer<typeof matchSuggestionSchema>;

export interface MatchSuggestionDto {
  id: string;
  cardAId: string;
  cardBId: string;
  score: number;
  rationale?: string | null;
  status: MatchSuggestionStatus;
  createdAt: string;
  updatedAt: string;
}
