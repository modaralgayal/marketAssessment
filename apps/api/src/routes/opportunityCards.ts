import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
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

// Opportunity-specific price list / terms upload: PDFs + common office types, 15 MB.
const assetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "image/png",
      "image/jpeg",
      "image/webp",
    ].includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Unsupported file type"));
  },
});

/** True if the caller may open a posted card's attachments (owner, or a posted card
 *  which is publicly browsable on the marketplace). */
function canViewCardAssets(card: { ownerAccountId: string; status: string }, accountId: string): boolean {
  return card.ownerAccountId === accountId || card.status === "POSTED";
}

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
    partner: c.partner ?? undefined,
    timing: c.timing ?? undefined,
    objective: c.objective ?? undefined,
    moq: c.moq ?? undefined,
    payment: c.payment ?? undefined,
    delivery: c.delivery ?? undefined,
    rights: c.rights ?? undefined,
    validUntil: c.validUntil ?? undefined,
    support: c.support ?? undefined,
    version: c.version ?? 1,
    sources: c.sources ?? null,
    assets: c.assets ?? null,
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

/**
 * Seed (idempotently) a conversation when a buyer expresses interest in a
 * manufacturer's opportunity card. The conversation's first message is the
 * buyer's "interest note", composed from the card + linked inquiry + note.
 * Returns the conversation id. One INTEREST conversation per (buyer, card).
 */
async function seedInterestConversation(opts: {
  buyerAccountId: string;
  manufacturerAccountId: string;
  card: { id: string; title: string };
  linkedInquiryId?: string | null;
  referralNote?: string | null;
}): Promise<string> {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "INTEREST",
      seedCardId: opts.card.id,
      participants: { some: { accountId: opts.buyerAccountId } },
    },
    select: { id: true },
  });
  if (existing) return existing.id;

  const lines: string[] = [`Interest in "${opts.card.title}"`];
  if (opts.linkedInquiryId) {
    const inquiry = await prisma.sourcingInquiry.findUnique({ where: { id: opts.linkedInquiryId } });
    if (inquiry) {
      lines.push(`Linked sourcing inquiry: ${inquiry.title}`);
      if (inquiry.products) lines.push(inquiry.products.slice(0, 500));
    }
  }
  if (opts.referralNote) lines.push(opts.referralNote);

  const conv = await prisma.conversation.create({
    data: {
      type: "INTEREST",
      subject: opts.card.title,
      seedCardId: opts.card.id,
      seedInquiryId: opts.linkedInquiryId ?? null,
      participants: {
        create: [
          { accountId: opts.buyerAccountId, role: "BUYER" },
          { accountId: opts.manufacturerAccountId, role: "MANUFACTURER" },
        ],
      },
      messages: {
        create: [{ kind: "INTEREST_NOTE", senderAccountId: null, body: lines.join("\n\n") }],
      },
    },
  });
  return conv.id;
}

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

/** Map the model's card-status label to the internal enum + visibility. */
function mapCardStatus(label?: string): { status: "DRAFT" | "POSTED" | "ARCHIVED"; publishedAt: Date | null } {
  if (label === "Open for buyer engagement") return { status: "POSTED", publishedAt: new Date() };
  if (label === "Closed") return { status: "ARCHIVED", publishedAt: null };
  return { status: "DRAFT", publishedAt: null };
}

/** Owner-scoped: create (side is derived from the account role). */
opportunityCardsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = opportunityCardSchema.parse(req.body);
    const side: OpportunitySide = req.account!.role === "MANUFACTURER" ? "SELL" : "BUY";
    const { status, publishedAt } = mapCardStatus(data.status);
    const card = await prisma.opportunityCard.create({
      data: {
        ownerAccountId: req.account!.id,
        side,
        title: data.title,
        summary: data.summary ?? null,
        category: data.category ?? null,
        territory: data.territory ?? null,
        channels: data.channels ?? [],
        partner: data.partner ?? null,
        timing: data.timing ?? null,
        objective: data.objective ?? null,
        moq: data.moq ?? null,
        payment: data.payment ?? null,
        delivery: data.delivery ?? null,
        rights: data.rights ?? null,
        validUntil: data.validUntil ?? null,
        support: data.support ?? null,
        version: 1,
        sources: (data.sources ?? []) as any,
        assets: (data.assets ?? []) as any,
        attributes: (data.attributes ?? {}) as any,
        status,
        publishedAt,
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
    const { status, publishedAt } = mapCardStatus(data.status);
    const updated = await prisma.opportunityCard.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        summary: data.summary ?? null,
        category: data.category ?? null,
        territory: data.territory ?? null,
        channels: data.channels ?? [],
        partner: data.partner ?? null,
        timing: data.timing ?? null,
        objective: data.objective ?? null,
        moq: data.moq ?? null,
        payment: data.payment ?? null,
        delivery: data.delivery ?? null,
        rights: data.rights ?? null,
        validUntil: data.validUntil ?? null,
        support: data.support ?? null,
        version: { increment: 1 },
        sources: (data.sources ?? []) as any,
        assets: (data.assets ?? []) as any,
        attributes: (data.attributes ?? {}) as any,
        status,
        publishedAt,
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

/** Owner-scoped: upload an opportunity-specific price list / terms PDF. Returns the
 *  storage key to store in the card's `assets` JSON. */
opportunityCardsRouter.post(
  "/:id/assets",
  requireAuth,
  assetUpload.single("asset"),
  async (req, res, next) => {
    try {
      const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
      if (!card) return res.status(404).json({ error: "Not found" });
      if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file provided" });
      const ext = path.extname(file.originalname).toLowerCase() || "";
      const key = `opportunity-cards/${card.id}/assets/${randomUUID()}${ext}`;
      await storage.put(key, file.buffer, file.mimetype);
      return res.status(201).json({
        id: key,
        name: file.originalname,
        kind: "pdf",
        contentType: file.mimetype,
        sizeBytes: file.size,
      });
    } catch (err) {
      next(err);
    }
  },
);

/** Owner-scoped: add an opportunity-specific price list / terms link. Returns the
 *  descriptor to store in the card's `assets` JSON. */
opportunityCardsRouter.post("/:id/assets/link", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const { url, name } = z
      .object({ url: z.string().trim().url(), name: z.string().trim().max(300).optional() })
      .parse(req.body);
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return res.status(400).json({ error: "Only http(s) links are allowed" });
    }
    return res.status(201).json({
      id: randomUUID(),
      name: name?.trim() || parsed.hostname,
      kind: "link",
      url,
    });
  } catch (err) {
    next(err);
  }
});

/** Owner-scoped: best-effort delete of an uploaded asset's R2 object. The caller
 *  then removes the entry from the card's `assets` JSON and saves the card. */
opportunityCardsRouter.delete("/:id/assets/:assetId", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (card.ownerAccountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const assetId = req.params.assetId;
    // Only delete R2 objects we created for this card (storage-key ids).
    if (assetId.startsWith(`opportunity-cards/${card.id}/assets/`)) {
      await storage.delete(assetId).catch(() => {});
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Download an opportunity-specific asset (owner, or any viewer of a posted card). */
opportunityCardsRouter.get("/:id/assets/:assetId/download", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (!canViewCardAssets(card, req.account!.id)) return res.status(403).json({ error: "Not authorized" });
    const asset = (card.assets as any[] | null)?.find((a) => a?.id === req.params.assetId);
    if (!asset || asset.kind !== "pdf" || !asset.id) return res.status(404).json({ error: "Asset not found" });
    const url = await storage.getSignedUrl(asset.id, 300);
    return res.json({ url, originalName: asset.name ?? "document" });
  } catch (err) {
    next(err);
  }
});

/** Download a catalogue reference attached to the manufacturer's profile (owner, or
 *  any viewer of a posted card). */
opportunityCardsRouter.get("/:id/sources/:sourceId/download", requireAuth, async (req, res, next) => {
  try {
    const card = await prisma.opportunityCard.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Not found" });
    if (!canViewCardAssets(card, req.account!.id)) return res.status(403).json({ error: "Not authorized" });
    const profile = await prisma.manufacturerProfile.findUnique({
      where: { accountId: card.ownerAccountId },
      include: { files: true },
    });
    const file = profile?.files.find((f) => f.id === req.params.sourceId);
    if (!file || !file.storageKey) return res.status(404).json({ error: "File not found" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
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
    // Seed a conversation from the interest note (idempotent per buyer+card).
    let conversationId: string | null = null;
    if (parsed.status === "INTERESTED") {
      conversationId = await seedInterestConversation({
        buyerAccountId: accountId,
        manufacturerAccountId: card.ownerAccountId,
        card: { id: card.id, title: card.title },
        linkedInquiryId: interaction.linkedInquiryId,
        referralNote: interaction.referralNote,
      });
    }
    return res.json({
      cardId: interaction.cardId,
      accountId: interaction.accountId,
      status: interaction.status,
      linkedInquiryId: interaction.linkedInquiryId ?? null,
      referralNote: interaction.referralNote ?? null,
      conversationId,
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
