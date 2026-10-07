import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAgent } from "../middleware/requireAgent.js";
import { matchSuggestionSchema, matchSuggestionStatusSchema, type MatchSuggestionDto } from "@mea/shared";

export const matchSuggestionsRouter = Router();

function toDto(m: any): MatchSuggestionDto {
  return {
    id: m.id,
    cardAId: m.cardAId,
    cardBId: m.cardBId,
    score: m.score,
    rationale: m.rationale ?? undefined,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

/** Agent-write: record a match suggestion produced by the matchmaking agent. */
matchSuggestionsRouter.post("/", requireAgent, async (req, res, next) => {
  try {
    const data = matchSuggestionSchema.parse(req.body);
    const suggestion = await prisma.matchSuggestion.create({
      data: {
        cardAId: data.cardAId,
        cardBId: data.cardBId,
        score: data.score,
        rationale: data.rationale ?? null,
        status: data.status ?? "NEW",
      },
    });
    return res.status(201).json(toDto(suggestion));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: list match suggestions touching any of my cards. */
matchSuggestionsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const myCardIds = (
      await prisma.opportunityCard.findMany({
        where: { ownerAccountId: req.account!.id },
        select: { id: true },
      })
    ).map((c) => c.id);
    if (myCardIds.length === 0) return res.json([]);
    const suggestions = await prisma.matchSuggestion.findMany({
      where: { OR: [{ cardAId: { in: myCardIds } }, { cardBId: { in: myCardIds } }] },
      orderBy: { score: "desc" },
    });
    return res.json(suggestions.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: update the status of a suggestion touching one of my cards. */
matchSuggestionsRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const status = matchSuggestionStatusSchema.parse(req.body?.status);
    const suggestion = await prisma.matchSuggestion.findUnique({ where: { id: req.params.id } });
    if (!suggestion) return res.status(404).json({ error: "Not found" });
    const myCardIds = (
      await prisma.opportunityCard.findMany({
        where: { ownerAccountId: req.account!.id },
        select: { id: true },
      })
    ).map((c) => c.id);
    if (!myCardIds.includes(suggestion.cardAId) && !myCardIds.includes(suggestion.cardBId)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const updated = await prisma.matchSuggestion.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});
