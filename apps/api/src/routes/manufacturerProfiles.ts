import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireRole } from "../middleware/requireAuth.js";
import { manufacturerProfileSchema, type ManufacturerProfileDto } from "@mea/shared";

export const manufacturerProfilesRouter = Router();

// Catalogue / price-list upload: common office + image types, max 10 MB.
const catalogueUpload = multer({
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
    else cb(new Error("Unsupported catalogue file type"));
  },
});

function toDto(p: any): ManufacturerProfileDto {
  return {
    id: p.id,
    accountId: p.accountId,
    companyName: p.companyName,
    country: p.country,
    website: p.website ?? undefined,
    industryCategory: p.industryCategory,
    annualRevenue: p.annualRevenue ?? undefined,
    annualRevenueCustom: p.annualRevenueCustom ?? undefined,
    yearsInBusiness: p.yearsInBusiness ?? undefined,
    currentExportMarkets: p.currentExportMarkets ?? undefined,
    halalCert: p.halalCert ?? undefined,
    sfdaStatus: p.sfdaStatus ?? undefined,
    frozenStorage: p.frozenStorage ?? undefined,
    shelfLife: p.shelfLife ?? undefined,
    otherCerts: p.otherCerts ?? [],
    otherCertsCustom: p.otherCertsCustom ?? undefined,
    labelLanguages: p.labelLanguages ?? undefined,
    productAdaptability: p.productAdaptability ?? undefined,
    brandApproach: p.brandApproach ?? undefined,
    leadTimes: p.leadTimes ?? undefined,
    gccCurrentlyActive: p.gccCurrentlyActive ?? undefined,
    currentGccMarkets: p.currentGccMarkets ?? [],
    gccSituation: p.gccSituation ?? undefined,
    targetMarketPotential: p.targetMarketPotential ?? undefined,
    targetMarketPotentialOther: p.targetMarketPotentialOther ?? undefined,
    salesChannels: p.salesChannels ?? [],
    channelStrategy: p.channelStrategy ?? undefined,
    moq: p.moq ?? undefined,
    exportContact: p.exportContact ?? undefined,
    productionCapacity: p.productionCapacity ?? undefined,
    contactFullName: p.contactFullName,
    contactTitle: p.contactTitle,
    contactEmail: p.contactEmail,
    contactPhone: p.contactPhone ?? undefined,
    anythingElse: p.anythingElse ?? undefined,
    contacts: p.contacts ?? undefined,
    productCategory: p.productCategory ?? undefined,
    companyInfo: p.companyInfo ?? undefined,
    // Expanded profile (reference prototype)
    exportCount: p.exportCount ?? undefined,
    topMarkets: p.topMarkets ?? undefined,
    knownFor: p.knownFor ?? undefined,
    pictures: p.pictures ?? undefined,
    logistics: p.logistics ?? undefined,
    usp: p.usp ?? undefined,
    branding: p.branding ?? undefined,
    privateLabel: p.privateLabel ?? undefined,
    certs: p.certs ?? [],
    catalogueCoverage: p.catalogueCoverage ?? undefined,
    catalogueFileId: p.catalogueFileId ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Get the signed-in manufacturer's own profile (404 if none yet). */
manufacturerProfilesRouter.get("/", requireRole("MANUFACTURER"), async (req, res, next) => {
  try {
    const profile = await prisma.manufacturerProfile.findUnique({
      where: { accountId: req.account!.id },
    });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    return res.json(toDto(profile));
  } catch (err) {
    next(err);
  }
});

/** Create or replace the signed-in manufacturer's own profile. */
manufacturerProfilesRouter.put("/", requireRole("MANUFACTURER"), async (req, res, next) => {
  try {
    const data = manufacturerProfileSchema.parse(req.body);
    const accountId = req.account!.id;
    const contacts = data.contacts as unknown as Prisma.InputJsonValue | undefined;
    const existing = await prisma.manufacturerProfile.findUnique({ where: { accountId } });
    const profile = existing
      ? await prisma.manufacturerProfile.update({ where: { accountId }, data: { ...data, contacts } })
      : await prisma.manufacturerProfile.create({ data: { accountId, ...data, contacts } });
    return res.json(toDto(profile));
  } catch (err) {
    next(err);
  }
});

/** Upload a catalogue / price list (creates a ManufacturerFile, points profile at it). */
manufacturerProfilesRouter.post(
  "/catalogue",
  requireRole("MANUFACTURER"),
  catalogueUpload.single("catalogue"),
  async (req, res, next) => {
    try {
      const accountId = req.account!.id;
      const profile = await prisma.manufacturerProfile.findUnique({ where: { accountId } });
      if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No catalogue file provided" });
      const ext = path.extname(file.originalname).toLowerCase() || "";
      const key = `manufacturers/${accountId}/catalogue-${randomUUID()}${ext}`;
      await storage.put(key, file.buffer, file.mimetype);
      const created = await prisma.manufacturerFile.create({
        data: {
          manufacturerProfileId: profile.id,
          storageKey: key,
          originalName: file.originalname,
          contentType: file.mimetype,
          sizeBytes: file.size,
        },
      });
      await prisma.manufacturerProfile.update({
        where: { accountId },
        data: { catalogueFileId: created.id },
      });
      return res.status(201).json({
        id: created.id,
        manufacturerProfileId: created.manufacturerProfileId,
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

/** Download the manufacturer's catalogue / price list. */
manufacturerProfilesRouter.get("/catalogue/download", requireRole("MANUFACTURER"), async (req, res, next) => {
  try {
    const profile = await prisma.manufacturerProfile.findUnique({ where: { accountId: req.account!.id } });
    if (!profile || !profile.catalogueFileId) return res.status(404).json({ error: "No catalogue uploaded" });
    const file = await prisma.manufacturerFile.findUnique({ where: { id: profile.catalogueFileId } });
    if (!file) return res.status(404).json({ error: "File not found" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
  } catch (err) {
    next(err);
  }
});

/** Remove the manufacturer's catalogue / price list. */
manufacturerProfilesRouter.delete("/catalogue", requireRole("MANUFACTURER"), async (req, res, next) => {
  try {
    const profile = await prisma.manufacturerProfile.findUnique({ where: { accountId: req.account!.id } });
    if (!profile || !profile.catalogueFileId) return res.status(204).send();
    const file = await prisma.manufacturerFile.findUnique({ where: { id: profile.catalogueFileId } });
    if (file) {
      await storage.delete(file.storageKey).catch(() => {});
      await prisma.manufacturerFile.delete({ where: { id: file.id } });
    }
    await prisma.manufacturerProfile.update({ where: { accountId: req.account!.id }, data: { catalogueFileId: null } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
