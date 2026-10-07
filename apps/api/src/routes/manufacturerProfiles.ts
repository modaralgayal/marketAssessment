import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireRole } from "../middleware/requireAuth.js";
import { manufacturerProfileSchema, type ManufacturerProfileDto } from "@mea/shared";

export const manufacturerProfilesRouter = Router();

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
