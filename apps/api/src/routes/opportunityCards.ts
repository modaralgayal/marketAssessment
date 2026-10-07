import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAgent } from "../middleware/requireAgent.js";
import { opportunityCardSchema, type OpportunityCardDto, type OpportunitySide } from "@mea/shared";

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
    attributes: c.attributes ?? undefined,
    publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
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
    });
    return res.json(cards.map(toDto));
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
