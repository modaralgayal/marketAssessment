import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAgent } from "../middleware/requireAgent.js";
import {
  opportunityCardSchema,
  opportunityInteractionStatusSchema,
  type OpportunityCardDto,
  type OpportunitySide,
  type MarketCardDto,
  type EngagementRowDto,
} from "@mea/shared";

export const opportunityCardsRouter = Router();

function toDto(c: any): OpportunityCardDto {
  return {
    id: c.id,
    ownerAccountId: c.ownerAccountId,
    side: c.side,
    status: c.status,
    title: c.title,
    summary: c.summary ?? undefined,
    category: c.category ?? undefined,
    territory: c.territory ?? undefined,
    channels: c.channels ?? [],
    attributes: c.attributes ?? undefined,
    publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** Build a marketplace card DTO enriched with the viewer's interaction + owner name. */
function toMarketDto(c: any): MarketCardDto {
  const base = toDto(c);
  const interaction = c.interactions?.[0] ?? null;
  const ownerProfile =
    c.side === "SELL" ? c.owner?.manufacturerProfile : c.owner?.buyerProfile;
  return {
    ...base,
    interaction: interaction
      ? {
          cardId: interaction.cardId,
          accountId: interaction.accountId,
          status: interaction.status,
          linkedInquiryId: interaction.linkedInquiryId ?? null,
          referralNote: interaction.referralNote ?? null,
          lastActivityAt: interaction.lastActivityAt ? interaction.lastActivityAt.toISOString() : null,
        }
      : null,
    owner: ownerProfile
      ? { companyName: ownerProfile.companyName, country: ownerProfile.country ?? null }
      : null,
  };
}

/** Marketplace browse: posted cards on the OPPOSITE side from the viewer's
 *  role. A buyer (BUY) sees posted SELL cards; a manufacturer (SELL) sees
 *  posted BUY cards. The matchmaking agent uses the separate `/feed` (x-api-key). */
opportunityCardsRouter.get("/market", requireAuth, async (req, res, next) => {
  try {
    const viewerSide = req.account!.role === "MANUFACTURER" ? "SELL" : "BUY";
    const wantedSide = viewerSide === "SELL" ? "BUY" : "SELL";
    const cards = await prisma.opportunityCard.findMany({
      where: { status: "POSTED", side: wantedSide },
      orderBy: { publishedAt: "desc" },
      include: {
        interactions: { where: { accountId: req.account!.id }, take: 1 },
        owner: { include: { manufacturerProfile: true, buyerProfile: true } },
      },
    });
    return res.json(cards.map(toMarketDto));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: list my cards (optionally filtered by ?status=). */
opportunityCardsRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
    const statusFilter =
      statusParam === "DRAFT" || statusParam === "POSTED" || statusParam === "ARCHIVED"
        ? statusParam
        : undefined;
    const cards = await prisma.opportunityCard.findMany({
      where: { ownerAccountId: req.account!.id, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return res.json(cards.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Agent feed: all POSTED cards (server-to-server, `x-api-key`). This is the
 *  hook the matchmaking agent consumes. Optional ?side=BUY|SELL filter. */
opportunityCardsRouter.get("/feed", requireAgent, async (req, res, next) => {
  try {
    const sideParam = typeof req.query.side === "string" ? req.query.side : undefined;
    const sideFilter = sideParam === "BUY" || sideParam === "SELL" ? sideParam : undefined;
    const cards = await prisma.opportunityCard.findMany({
      where: { status: "POSTED", ...(sideFilter ? { side: sideFilter } : {}) },
      orderBy: { publishedAt: "desc" },
    });
    return res.json(cards.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Manufacturer: per-buyer engagement across the manufacturer's posted cards. */
opportunityCardsRouter.get("/engagement", requireAuth, async (req, res, next) => {
  try {
    if (req.account!.role !== "MANUFACTURER") return res.status(403).json({ error: "Not authorized" });
    const cardIdParam = typeof req.query.cardId === "string" ? req.query.cardId : undefined;
    const myCards = await prisma.opportunityCard.findMany({
      where: { ownerAccountId: req.account!.id, status: "POSTED", ...(cardIdParam ? { id: cardIdParam } : {}) },
      select: { id: true, title: true },
    });
    const cardIds = myCards.map((c) => c.id);
    if (cardIds.length === 0) return res.json([]);
    const interactions = await prisma.opportunityInteraction.findMany({
      where: { cardId: { in: cardIds }, status: { not: "NEW" } },
      include: { account: { include: { buyerProfile: true } } },
      orderBy: { lastActivityAt: "desc" },
    });
    const rows: EngagementRowDto[] = interactions.map((it) => ({
      cardId: it.cardId,
      cardTitle: myCards.find((c) => c.id === it.cardId)?.title ?? "",
      buyerAccountId: it.accountId,
      buyerName: it.account.buyerProfile?.companyName ?? it.account.email,
      buyerEmail: it.account.email,
      status: it.status,
      linkedInquiryId: it.linkedInquiryId ?? null,
      lastActivityAt: it.lastActivityAt ? it.lastActivityAt.toISOString() : null,
    }));
    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: get one of my cards. */
opportunityCardsRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    return res.json(toDto(card));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: create (side is derived from the account role). */
opportunityCardsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = opportunityCardSchema.parse(req.body);
    const side: OpportunitySide = req.account!.role === "MANUFACTURER" ? "SELL" : "BUY";
    const card = await prisma.opportunityCard.create({
      data: {
        ownerAccountId: req.account!.id,
        side,
        title: data.title,
        summary: data.summary ?? null,
        category: data.category ?? null,
        territory: data.territory ?? null,
        channels: data.channels ?? [],
        attributes: (data.attributes ?? {}) as any,
      },
    });
    return res.status(201).json(toDto(card));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: update one of my cards. */
opportunityCardsRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const data = opportunityCardSchema.parse(req.body);
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const updated = await prisma.opportunityCard.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        summary: data.summary ?? null,
        category: data.category ?? null,
        territory: data.territory ?? null,
        channels: data.channels ?? [],
        attributes: (data.attributes ?? {}) as any,
      },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: delete one of my cards. */
opportunityCardsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    await prisma.opportunityCard.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: publish (DRAFT → POSTED). The explicit handoff to matching. */
opportunityCardsRouter.post("/:id/publish", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const updated = await prisma.opportunityCard.update({
      where: { id: req.params.id },
      data: { status: "POSTED", publishedAt: new Date() },
    });
    await prisma.activityEvent.create({
      data: {
        accountId: req.account!.id,
        actorAccountId: req.account!.id,
        type: "card_published",
        payload: { cardId: card.id, title: card.title } as Prisma.InputJsonValue,
      },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: unpublish (POSTED → DRAFT). */
opportunityCardsRouter.post("/:id/unpublish", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const updated = await prisma.opportunityCard.update({
      where: { id: req.params.id },
      data: { status: "DRAFT", publishedAt: null },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/** Buyer: record an interaction (viewed / saved / interested / declined / referred)
 *  on a marketplace card. Upserted per (card, buyer). */
opportunityCardsRouter.post("/:id/interactions", requireAuth, async (req, res, next) => {
  try {
    if (req.account!.role !== "BUYER") return res.status(403).json({ error: "Not authorized" });
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId === req.account!.id) {
      return res.status(400).json({ error: "Cannot interact with your own card" });
    }
    const parsed = z
      .object({
        status: opportunityInteractionStatusSchema,
        linkedInquiryId: z.string().optional(),
        referralNote: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
      })
      .parse(req.body);
    const accountId = req.account!.id;
    const now = new Date();
    const existing = await prisma.opportunityInteraction.findUnique({
      where: { cardId_accountId: { cardId: card.id, accountId } },
    });
    // VIEWED must not downgrade a stronger stated status.
    const status =
      parsed.status === "VIEWED" && existing && existing.status !== "NEW" ? existing.status : parsed.status;
    const interaction = await prisma.opportunityInteraction.upsert({
      where: { cardId_accountId: { cardId: card.id, accountId } },
      create: {
        cardId: card.id,
        accountId,
        status,
        viewedAt: parsed.status === "VIEWED" ? now : existing?.viewedAt ?? null,
        lastActivityAt: now,
        linkedInquiryId: parsed.linkedInquiryId ?? null,
        referralNote: parsed.referralNote ?? null,
      },
      update: {
        status,
        lastActivityAt: now,
        viewedAt: parsed.status === "VIEWED" ? now : existing?.viewedAt ?? null,
        linkedInquiryId: parsed.linkedInquiryId ?? existing?.linkedInquiryId ?? null,
        referralNote: parsed.referralNote ?? existing?.referralNote ?? null,
      },
    });
    if (parsed.status === "INTERESTED" || parsed.status === "REFERRED") {
      await prisma.activityEvent.create({
        data: {
          accountId: card.ownerAccountId,
          actorAccountId: accountId,
          type: parsed.status === "REFERRED" ? "referral_made" : "interest_expressed",
          payload: { cardId: card.id, inquiryId: parsed.linkedInquiryId ?? null } as Prisma.InputJsonValue,
        },
      });
    }
    return res.json({
      cardId: interaction.cardId,
      accountId: interaction.accountId,
      status: interaction.status,
      linkedInquiryId: interaction.linkedInquiryId ?? null,
      referralNote: interaction.referralNote ?? null,
      lastActivityAt: interaction.lastActivityAt ? interaction.lastActivityAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
});

/** Manufacturer: share a posted card with chosen buyers (records activity). */
opportunityCardsRouter.post("/:id/share", requireAuth, async (req, res, next) => {
  try {
    if (req.account!.role !== "MANUFACTURER") return res.status(403).json({ error: "Not authorized" });
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const parsed = z
      .object({
        recipientIds: z.array(z.string().min(1)).default([]),
        message: z.string().trim().max(4000).optional().or(z.literal("").transform(() => undefined)),
      })
      .parse(req.body);
    for (const rid of parsed.recipientIds) {
      await prisma.activityEvent.create({
        data: {
          accountId: rid,
          actorAccountId: req.account!.id,
          type: "shared",
          payload: {
            cardId: card.id,
            title: card.title,
            message: parsed.message ?? null,
          } as Prisma.InputJsonValue,
        },
      });
    }
    return res.json({ shared: parsed.recipientIds.length });
  } catch (err) {
    next(err);
  }
});
