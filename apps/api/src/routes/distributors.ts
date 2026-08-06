import { Router } from "express";
import rateLimit from "express-rate-limit";
import { distributorSchema, type DistributorDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import { syncFromSheet, syncSingleDistributorFromSheet, writeDistributorToSheet } from "../lib/sheetsSync.js";
import { env } from "../env.js";
import {
  computeDataTier,
  loadTierTemplate,
  invalidateTemplateCache,
} from "../lib/dataTier.js";

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
    dataTier: d.dataTier ?? 3,
    attributes: (d.attributes as Record<string, any>) ?? {},
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
    const attributes = data.attributes ?? {};
    const dataTier = computeDataTier(attributes);
    const distributor = await prisma.distributor.create({
      data: {
        ...data,
        dataTier,
        attributes,
      },
    });
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
    const attributes = data.attributes ?? {};
    const dataTier = computeDataTier(attributes);
    const distributor = await prisma.distributor.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dataTier,
        attributes,
      },
      include: { _count: { select: { matches: true } } },
    });

    // If a Google access token was provided, write the updated data back to the sheet
    const { googleAccessToken } = req.body;
    let sheetUpdated = false;
    let sheetError: string | undefined;
    if (googleAccessToken && typeof googleAccessToken === "string") {
      const dto = toDto(distributor);
      try {
        sheetUpdated = await writeDistributorToSheet(googleAccessToken, dto);
      } catch (err: any) {
        sheetError = err.message;
        console.error(`[distributors] Failed to write back to sheet for "${dto.companyName}":`, err.message);
      }
    }

    return res.json({ ...toDto(distributor), sheetUpdated, sheetError });
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

    // Compute dataTier for each item and merge attributes
    const enriched = validItems.map((item) => {
      const attributes = (item as any).attributes ?? {};
      return {
        ...item,
        attributes,
        dataTier: computeDataTier(attributes),
      };
    });

    const result = await prisma.distributor.createMany({ data: enriched });
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

/** Sync a single distributor from Google Sheets by company name. */
distributorsRouter.post("/:id/sync-from-sheet", async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "accessToken is required." });
    }

    if (!env.GOOGLE_SHEET_ID) {
      return res.status(400).json({ error: "Google Sheets sync is not configured." });
    }

    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
    });
    if (!distributor) return res.status(404).json({ error: "Distributor not found" });

    const result = await syncSingleDistributorFromSheet(accessToken, distributor.companyName);
    if (!result) {
      return res.status(404).json({ error: `Distributor "${distributor.companyName}" not found in the Google Sheet.` });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Data Tier Endpoints ─────────────────────────────────────────────────

/** Get the data tier template config. */
distributorsRouter.get("/data-tier/template", async (_req, res, next) => {
  try {
    const template = loadTierTemplate();
    return res.json(template);
  } catch (err) {
    next(err);
  }
});

/** Bulk-recalculate data tiers for all distributors. */
distributorsRouter.post("/data-tier/recalc", async (_req, res, next) => {
  try {
    // Invalidate cache so we pick up any template changes
    invalidateTemplateCache();

    const distributors = await prisma.distributor.findMany({ select: { id: true, attributes: true } });
    let updated = 0;

    for (const d of distributors) {
      const attrs = (d.attributes as Record<string, any>) ?? {};
      const newTier = computeDataTier(attrs);
      await prisma.distributor.update({
        where: { id: d.id },
        data: { dataTier: newTier },
      });
      updated++;
    }

    return res.json({ updated });
  } catch (err) {
    next(err);
  }
});

/** Recalculate data tier for a single distributor. */
distributorsRouter.post("/:id/recalc-tier", async (req, res, next) => {
  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: req.params.id },
    });
    if (!distributor) return res.status(404).json({ error: "Distributor not found" });

    invalidateTemplateCache();
    const attrs = (distributor.attributes as Record<string, any>) ?? {};
    const dataTier = computeDataTier(attrs);

    await prisma.distributor.update({
      where: { id: req.params.id },
      data: { dataTier },
    });

    return res.json({ dataTier });
  } catch (err) {
    next(err);
  }
});