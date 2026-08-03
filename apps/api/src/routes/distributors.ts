import { Router } from "express";
import rateLimit from "express-rate-limit";
import { distributorSchema, type DistributorDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import { syncFromSheet } from "../lib/sheetsSync.js";
import { env } from "../env.js";

export const distributorsRouter = Router();

// All distributor routes require admin authentication
distributorsRouter.use(requireAdmin);
distributorsRouter.use(auditLog);

const bulkImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many import requests, please try again later." },
});

const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sync requests, please try again later." },
});

function toDto(d: any): DistributorDto {
  return {
    id: d.id,
    companyName: d.companyName,
    cityRegion: d.cityRegion,
    channelType: d.channelType,
    sizeScale: d.sizeScale ?? undefined,
    website: d.website ?? undefined,
    phone: d.phone ?? undefined,
    email: d.email ?? undefined,
    contactPerson: d.contactPerson ?? undefined,
    doWeKnowThem: d.doWeKnowThem ?? undefined,
    statusLastContact: d.statusLastContact ?? undefined,
    description: d.description ?? undefined,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    matchCount: d._count?.matches ?? undefined,
  };
}

/** List all distributors (with optional match count). */
distributorsRouter.get("/", async (_req, res, next) => {
  try {
    const distributors = await prisma.distributor.findMany({
      orderBy: { companyName: "asc" },
      include: { _count: { select: { matches: true } } },
    });
    return res.json(distributors.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Get a single distributor. */
distributorsRouter.get("/:id", async (req, res, next) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { matches: true } } },
    });
    if (!distributor) return res.status(404).json({ error: "Distributor not found" });
    return res.json(toDto(distributor));
  } catch (err) {
    next(err);
  }
});

/** Create a distributor. */
distributorsRouter.post("/", async (req, res, next) => {
  try {
    const data = distributorSchema.parse(req.body);
    const distributor = await prisma.distributor.create({ data });
    return res.status(201).json(toDto(distributor));
  } catch (err) {
    next(err);
  }
});

/** Update a distributor. */
distributorsRouter.put("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.distributor.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Distributor not found" });

    const data = distributorSchema.parse(req.body);
    const distributor = await prisma.distributor.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { matches: true } } },
    });
    return res.json(toDto(distributor));
  } catch (err) {
    next(err);
  }
});

/** Delete a distributor. */
distributorsRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.distributor.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Distributor not found" });

    await prisma.distributor.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/** Bulk import distributors from a JSON array. */
distributorsRouter.post("/import", bulkImportLimiter, async (req, res, next) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Request body must be a non-empty array of distributor objects." });
    }

    // Validate each item
    const validItems = [];
    for (const [i, item] of items.entries()) {
      try {
        validItems.push(distributorSchema.parse(item));
      } catch (err: any) {
        return res.status(400).json({
          error: `Distributor at index ${i} is invalid: ${err.message}`,
        });
      }
    }

    const result = await prisma.distributor.createMany({ data: validItems });
    return res.status(201).json({ imported: result.count });
  } catch (err) {
    next(err);
  }
});

/** Sync from Google Sheets. Requires a one-time OAuth access token. */
distributorsRouter.post("/sync", syncLimiter, async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "accessToken is required." });
    }

    if (!env.GOOGLE_SHEET_ID) {
      return res.status(400).json({ error: "Google Sheets sync is not configured. Set GOOGLE_SHEET_ID." });
    }

    const result = await syncFromSheet(accessToken);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});