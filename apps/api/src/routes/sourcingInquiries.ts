import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireRole } from "../middleware/requireAuth.js";
import {
  sourcingInquirySchema,
  type SourcingInquiryDto,
  type SourcingInquiryBriefDto,
} from "@mea/shared";

export const sourcingInquiriesRouter = Router();

// Buying-brief attachments: any document type, max 10 MB, held in memory.
const briefUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function briefToDto(f: any): SourcingInquiryBriefDto {
  return {
    id: f.id,
    inquiryId: f.inquiryId,
    storageKey: f.storageKey,
    originalName: f.originalName,
    contentType: f.contentType,
    sizeBytes: f.sizeBytes,
    createdAt: f.createdAt.toISOString(),
  };
}

function toDto(i: any): SourcingInquiryDto {
  return {
    id: i.id,
    accountId: i.accountId,
    title: i.title,
    products: i.products,
    productType: i.productType,
    market: i.market ?? undefined,
    channels: i.channels ?? [],
    priceTier: i.priceTier ?? undefined,
    targetPrice: i.targetPrice ?? undefined,
    timeframe: i.timeframe ?? undefined,
    quantity: i.quantity ?? undefined,
    essential: i.essential ?? undefined,
    negotiable: i.negotiable ?? undefined,
    status: i.status,
    attributes: i.attributes ?? undefined,
    briefs: (i.briefs ?? []).map(briefToDto),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

/** List the signed-in buyer's own sourcing inquiries. */
sourcingInquiriesRouter.get("/", requireRole("BUYER"), async (req, res, next) => {
  try {
    const inquiries = await prisma.sourcingInquiry.findMany({
      where: { accountId: req.account!.id },
      orderBy: { updatedAt: "desc" },
      include: { briefs: true },
    });
    return res.json(inquiries.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Create a sourcing inquiry (buying brief). */
sourcingInquiriesRouter.post("/", requireRole("BUYER"), async (req, res, next) => {
  try {
    const data = sourcingInquirySchema.parse(req.body);
    const accountId = req.account!.id;
    const inquiry = await prisma.sourcingInquiry.create({
      data: { accountId, ...data, attributes: data.attributes as unknown as Prisma.InputJsonValue | undefined },
      include: { briefs: true },
    });
    // Surface the new inquiry in the buyer's own activity feed.
    await prisma.activityEvent.create({
      data: {
        accountId,
        actorAccountId: accountId,
        type: "inquiry_created",
        payload: { inquiryId: inquiry.id, title: inquiry.title } as Prisma.InputJsonValue,
      },
    });
    return res.status(201).json(toDto(inquiry));
  } catch (err) {
    next(err);
  }
});

/** Get one of my inquiries (with briefs). */
sourcingInquiriesRouter.get("/:id", requireRole("BUYER"), async (req, res, next) => {
  try {
    const inquiry = await prisma.sourcingInquiry.findUnique({
      where: { id: req.params.id },
      include: { briefs: true },
    });
    if (!inquiry) return res.status(404).json({ error: "Not found" });
    if (inquiry.accountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    return res.json(toDto(inquiry));
  } catch (err) {
    next(err);
  }
});

/** Update one of my inquiries. */
sourcingInquiriesRouter.put("/:id", requireRole("BUYER"), async (req, res, next) => {
  try {
    const data = sourcingInquirySchema.parse(req.body);
    const existing = await prisma.sourcingInquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.accountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    const updated = await prisma.sourcingInquiry.update({
      where: { id: req.params.id },
      data: { ...data, attributes: data.attributes as unknown as Prisma.InputJsonValue | undefined },
      include: { briefs: true },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/** Delete one of my inquiries. */
sourcingInquiriesRouter.delete("/:id", requireRole("BUYER"), async (req, res, next) => {
  try {
    const existing = await prisma.sourcingInquiry.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.accountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
    await prisma.sourcingInquiry.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Attach a buying-brief document to an inquiry. */
sourcingInquiriesRouter.post(
  "/:id/briefs",
  requireRole("BUYER"),
  briefUpload.single("brief"),
  async (req, res, next) => {
    try {
      const inquiry = await prisma.sourcingInquiry.findUnique({ where: { id: req.params.id } });
      if (!inquiry) return res.status(404).json({ error: "Not found" });
      if (inquiry.accountId !== req.account!.id) return res.status(403).json({ error: "Not authorized" });
      const briefCount = await prisma.sourcingInquiryFile.count({ where: { inquiryId: inquiry.id } });
      if (briefCount >= 2) return res.status(400).json({ error: "Maximum 2 briefs per inquiry" });
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No brief file provided" });
      const ext = path.extname(file.originalname).toLowerCase() || "";
      const key = `inquiries/${inquiry.id}/brief-${randomUUID()}${ext}`;
      await storage.put(key, file.buffer, file.mimetype);
      const created = await prisma.sourcingInquiryFile.create({
        data: {
          inquiryId: inquiry.id,
          storageKey: key,
          originalName: file.originalname,
          contentType: file.mimetype,
          sizeBytes: file.size,
        },
      });
      return res.status(201).json(briefToDto(created));
    } catch (err) {
      next(err);
    }
  },
);

/** Download a brief attached to one of my inquiries. */
sourcingInquiriesRouter.get("/:id/briefs/:fileId/download", requireRole("BUYER"), async (req, res, next) => {
  try {
    const inquiry = await prisma.sourcingInquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry || inquiry.accountId !== req.account!.id) {
      return res.status(404).json({ error: "Not found" });
    }
    const file = await prisma.sourcingInquiryFile.findUnique({ where: { id: req.params.fileId } });
    if (!file || file.inquiryId !== inquiry.id) return res.status(404).json({ error: "File not found" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
  } catch (err) {
    next(err);
  }
});
