import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireRole, requireAuth } from "../middleware/requireAuth.js";
import { buyerProfileSchema, type BuyerProfileDto } from "@mea/shared";

export const buyerProfilesRouter = Router();

// Portfolio / assortment documents: common office + image types, max 10 MB.
const portfolioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
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
    else cb(new Error("Unsupported portfolio file type"));
  },
});

// Profile logo / image upload: images only, max 5 MB.
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/webp" ||
      file.mimetype === "image/gif" ||
      /\.(png|jpe?g|webp|gif)$/i.test(file.originalname);
    if (ok) return cb(null, true);
    cb(new Error("Please attach a PNG, JPG, WEBP, or GIF image."));
  },
});

function toDto(p: any): BuyerProfileDto {
  return {
    id: p.id,
    accountId: p.accountId,
    buyerType: p.buyerType,
    companyName: p.companyName,
    country: p.country,
    website: p.website ?? undefined,
    // 01 Company
    tradingName: p.tradingName ?? undefined,
    hqCountry: p.hqCountry ?? undefined,
    hqCity: p.hqCity ?? undefined,
    operatingCountries: p.operatingCountries ?? [],
    roles: p.roles ?? [],
    // Categories & portfolio
    categories: p.categories ?? [],
    portfolioInfo: p.portfolioInfo ?? undefined,
    publicDescription: p.publicDescription ?? undefined,
    portfolioProducts: p.portfolioProducts ?? undefined,
    privateLabel: p.privateLabel ?? undefined,
    privateLabelName: p.privateLabelName ?? undefined,
    privateLabelCategories: p.privateLabelCategories ?? undefined,
    // Sourcing preferences / needs
    sourcingNeeds: p.sourcingNeeds ?? undefined,
    targetMarkets: p.targetMarkets ?? [],
    // 04 Importer & distributor profile
    distributionRole: p.distributionRole ?? undefined,
    warehouse: p.warehouse ?? undefined,
    warehouseArrangement: p.warehouseArrangement ?? undefined,
    storage: p.storage ?? [],
    vehicles: p.vehicles ?? undefined,
    vehicleArrangement: p.vehicleArrangement ?? undefined,
    channels: p.channels ?? [],
    channelPercentages: p.channelPercentages ?? undefined,
    channelBasis: p.channelBasis ?? undefined,
    salesPoints: p.salesPoints ?? undefined,
    salesReachMode: p.salesReachMode ?? undefined,
    distributionGeography: p.distributionGeography ?? undefined,
    expandPortfolio: p.expandPortfolio ?? undefined,
    expansionProducts: p.expansionProducts ?? undefined,
    distributionProductType: p.distributionProductType ?? undefined,
    // 05 Retailer profile
    retailFormats: p.retailFormats ?? [],
    storeCount: p.storeCount ?? undefined,
    retailGeography: p.retailGeography ?? undefined,
    purchasingStructure: p.purchasingStructure ?? undefined,
    purchasingOffice: p.purchasingOffice ?? undefined,
    purchasingOutsourced: p.purchasingOutsourced ?? undefined,
    purchasingSubsidiary: p.purchasingSubsidiary ?? undefined,
    purchasingSubsidiaryName: p.purchasingSubsidiaryName ?? undefined,
    retailSupply: p.retailSupply ?? undefined,
    directImportPercent: p.directImportPercent ?? undefined,
    localSupplierPercent: p.localSupplierPercent ?? undefined,
    retailMixBasis: p.retailMixBasis ?? undefined,
    assortmentPlan: p.assortmentPlan ?? undefined,
    retailExpansionProducts: p.retailExpansionProducts ?? undefined,
    retailProductType: p.retailProductType ?? undefined,
    retailDelivery: p.retailDelivery ?? undefined,
    details: p.details ?? undefined,
    // Decision-maker contact
    contactFullName: p.contactFullName,
    contactTitle: p.contactTitle,
    contactEmail: p.contactEmail,
    contactPhone: p.contactPhone ?? undefined,
    contacts: p.contacts ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Like `toDto`, but also resolves a short-lived signed URL for the profile logo. */
async function toDtoWithLogo(p: any): Promise<BuyerProfileDto> {
  const base = toDto(p);
  const logo = (p.portfolioFiles ?? []).find((f: any) => f.id === p.logoFileId);
  base.logoUrl = logo ? await storage.getSignedUrl(logo.storageKey, 300).catch(() => null) : null;
  return base;
}

/** Get the signed-in buyer's own profile (404 if none yet). */
buyerProfilesRouter.get("/", requireRole("BUYER"), async (req, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({
      where: { accountId: req.account!.id },
      include: { portfolioFiles: true },
    });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    return res.json(await toDtoWithLogo(profile));
  } catch (err) {
    next(err);
  }
});

/** Create or replace the signed-in buyer's own profile. */
buyerProfilesRouter.put("/", requireRole("BUYER"), async (req, res, next) => {
  try {
    const data = buyerProfileSchema.parse(req.body);
    const accountId = req.account!.id;
    const contacts = data.contacts as unknown as Prisma.InputJsonValue | undefined;
    const details = data.details as unknown as Prisma.InputJsonValue | undefined;
    const existing = await prisma.buyerProfile.findUnique({ where: { accountId } });
    const profile = existing
      ? await prisma.buyerProfile.update({ where: { accountId }, data: { ...data, contacts, details }, include: { portfolioFiles: true } })
      : await prisma.buyerProfile.create({ data: { accountId, ...data, contacts, details }, include: { portfolioFiles: true } });
    return res.json(await toDtoWithLogo(profile));
  } catch (err) {
    next(err);
  }
});

/** Upload a profile logo / image. Stored as a BuyerFile; the file id is recorded on
 *  the profile's `logoFileId`. Replaces any prior logo. */
buyerProfilesRouter.post(
  "/logo",
  requireRole("BUYER"),
  logoUpload.single("logo"),
  async (req, res, next) => {
    try {
      const accountId = req.account!.id;
      const profile = await prisma.buyerProfile.findUnique({
        where: { accountId },
        include: { portfolioFiles: true },
      });
      if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No image provided" });
      const ext = path.extname(file.originalname).toLowerCase() || ".png";
      const key = `buyers/${accountId}/logo-${randomUUID()}${ext}`;
      await storage.put(key, file.buffer, file.mimetype);
      const created = await prisma.buyerFile.create({
        data: {
          buyerProfileId: profile.id,
          storageKey: key,
          originalName: file.originalname,
          contentType: file.mimetype,
          sizeBytes: file.size,
        },
      });
      // Best-effort delete of the previously linked logo.
      if (profile.logoFileId) {
        const prev = profile.portfolioFiles.find((f) => f.id === profile.logoFileId);
        if (prev) {
          if (prev.storageKey) await storage.delete(prev.storageKey).catch(() => {});
          await prisma.buyerFile.delete({ where: { id: prev.id } }).catch(() => {});
        }
      }
      const updated = await prisma.buyerProfile.update({
        where: { accountId },
        data: { logoFileId: created.id },
        include: { portfolioFiles: true },
      });
      return res.status(201).json(await toDtoWithLogo(updated));
    } catch (err) {
      next(err);
    }
  },
);

/** Remove the profile logo (clears `logoFileId`, deletes the underlying file). */
buyerProfilesRouter.delete("/logo", requireRole("BUYER"), async (req, res, next) => {
  try {
    const accountId = req.account!.id;
    const profile = await prisma.buyerProfile.findUnique({
      where: { accountId },
      include: { portfolioFiles: true },
    });
    if (profile?.logoFileId) {
      const logo = profile.portfolioFiles.find((f) => f.id === profile.logoFileId);
      if (logo?.storageKey) await storage.delete(logo.storageKey).catch(() => {});
      await prisma.buyerFile.delete({ where: { id: profile.logoFileId } }).catch(() => {});
      await prisma.buyerProfile.update({ where: { accountId }, data: { logoFileId: null } });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Public buyer profile: visible to any signed-in account (e.g. a manufacturer
 *  viewing who they are messaging). Returns only safe fields. */
buyerProfilesRouter.get("/public/:accountId", requireAuth, async (req, res, next) => {
  try {
    const accountId = req.params.accountId;
    const profile = await prisma.buyerProfile.findUnique({
      where: { accountId },
      include: { portfolioFiles: true },
    });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    const logo = (profile.portfolioFiles ?? []).find((f: any) => f.id === profile.logoFileId);
    const logoUrl = logo ? await storage.getSignedUrl(logo.storageKey, 300).catch(() => null) : null;
    return res.json({
      accountId: profile.accountId,
      companyName: profile.companyName,
      country: profile.country ?? null,
      website: profile.website ?? null,
      publicDescription: profile.publicDescription ?? null,
      logoUrl,
      buyerType: profile.buyerType ?? null,
      roles: profile.roles ?? [],
      categories: profile.categories ?? [],
      operatingCountries: profile.operatingCountries ?? [],
      targetMarkets: profile.targetMarkets ?? [],
      channels: profile.channels ?? [],
      sourcingNeeds: profile.sourcingNeeds ?? null,
    });
  } catch (err) {
    next(err);
  }
});

/** Upload a portfolio / assortment document (creates a BuyerFile). */
buyerProfilesRouter.post(
  "/portfolio",
  requireRole("BUYER"),
  portfolioUpload.single("portfolio"),
  async (req, res, next) => {
    try {
      const accountId = req.account!.id;
      const profile = await prisma.buyerProfile.findUnique({ where: { accountId } });
      if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No portfolio file provided" });
      const ext = path.extname(file.originalname).toLowerCase() || "";
      const key = `buyers/${accountId}/portfolio-${randomUUID()}${ext}`;
      await storage.put(key, file.buffer, file.mimetype);
      const created = await prisma.buyerFile.create({
        data: {
          buyerProfileId: profile.id,
          storageKey: key,
          originalName: file.originalname,
          contentType: file.mimetype,
          sizeBytes: file.size,
        },
      });
      return res.status(201).json({
        id: created.id,
        buyerProfileId: created.buyerProfileId,
        storageKey: created.storageKey,
        originalName: created.originalName,
        contentType: created.contentType,
        sizeBytes: created.sizeBytes,
        createdAt: created.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);

/** List the buyer's portfolio documents. */
buyerProfilesRouter.get("/portfolio", requireRole("BUYER"), async (req, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({ where: { accountId: req.account!.id } });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    const files = await prisma.buyerFile.findMany({ where: { buyerProfileId: profile.id } });
    return res.json(
      files.map((f) => ({
        id: f.id,
        buyerProfileId: f.buyerProfileId,
        storageKey: f.storageKey,
        originalName: f.originalName,
        contentType: f.contentType,
        sizeBytes: f.sizeBytes,
        createdAt: f.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    next(err);
  }
});

/** Download a portfolio document. */
buyerProfilesRouter.get("/portfolio/:fileId/download", requireRole("BUYER"), async (req, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({ where: { accountId: req.account!.id } });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    const file = await prisma.buyerFile.findUnique({ where: { id: req.params.fileId } });
    if (!file || file.buyerProfileId !== profile.id) return res.status(404).json({ error: "File not found" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
  } catch (err) {
    next(err);
  }
});

/** Delete a portfolio document. */
buyerProfilesRouter.delete("/portfolio/:fileId", requireRole("BUYER"), async (req, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({ where: { accountId: req.account!.id } });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    const file = await prisma.buyerFile.findUnique({ where: { id: req.params.fileId } });
    if (!file || file.buyerProfileId !== profile.id) return res.status(404).json({ error: "File not found" });
    await storage.delete(file.storageKey);
    await prisma.buyerFile.delete({ where: { id: file.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
