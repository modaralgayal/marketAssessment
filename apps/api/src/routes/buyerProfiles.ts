import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { requireRole } from "../middleware/requireAuth.js";
import { buyerProfileSchema, type BuyerProfileDto } from "@mea/shared";

export const buyerProfilesRouter = Router();

function toDto(p: any): BuyerProfileDto {
  return {
    id: p.id,
    accountId: p.accountId,
    buyerType: p.buyerType,
    companyName: p.companyName,
    country: p.country,
    website: p.website ?? undefined,
    categories: p.categories ?? [],
    portfolioInfo: p.portfolioInfo ?? undefined,
    sourcingNeeds: p.sourcingNeeds ?? undefined,
    targetMarkets: p.targetMarkets ?? [],
    contactFullName: p.contactFullName,
    contactTitle: p.contactTitle,
    contactEmail: p.contactEmail,
    contactPhone: p.contactPhone ?? undefined,
    contacts: p.contacts ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Get the signed-in buyer's own profile (404 if none yet). */
buyerProfilesRouter.get("/", requireRole("BUYER"), async (req, res, next) => {
  try {
    const profile = await prisma.buyerProfile.findUnique({
      where: { accountId: req.account!.id },
    });
    if (!profile) return res.status(404).json({ error: "NO_PROFILE" });
    return res.json(toDto(profile));
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
    const existing = await prisma.buyerProfile.findUnique({ where: { accountId } });
    const profile = existing
      ? await prisma.buyerProfile.update({ where: { accountId }, data: { ...data, contacts } })
      : await prisma.buyerProfile.create({ data: { accountId, ...data, contacts } });
    return res.json(toDto(profile));
  } catch (err) {
    next(err);
  }
});
