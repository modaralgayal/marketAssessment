import { Router } from "express";
import { customerSchema, type CustomerDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const customersRouter = Router();

/** Admin: list all customers. */
customersRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(customers.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** Admin: get single customer by ID. */
customersRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    return res.json(toDto(customer));
  } catch (err) {
    next(err);
  }
});

/** Admin: create a new customer. */
customersRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = customerSchema.parse(req.body);
    const onboardingDate = data.onboardingDate ? new Date(data.onboardingDate) : undefined;
    const customer = await prisma.customer.create({
      data: { ...data, onboardingDate },
    });
    return res.status(201).json(toDto(customer));
  } catch (err) {
    next(err);
  }
});

/** Admin: update a customer. */
customersRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const data = customerSchema.parse(req.body);
    const onboardingDate = data.onboardingDate ? new Date(data.onboardingDate) : undefined;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { ...data, onboardingDate },
    });
    return res.json(toDto(customer));
  } catch (err) {
    next(err);
  }
});

/** Admin: delete a customer. */
customersRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ── Conversion from Submission ───────────────────────────────────────────

/** Admin: convert a submission into a customer. */
customersRouter.post(
  "/from-submission/:submissionId",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { submissionId } = req.params;

      // Verify submission exists
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Check if customer already exists for this submission
      const existing = await prisma.customer.findUnique({
        where: { submissionId },
      });
      if (existing) {
        return res.status(400).json({ error: "A customer already exists for this submission" });
      }

      // Create customer from all submission data
      const customer = await prisma.customer.create({
        data: {
          submissionId,
          companyName: submission.companyName,
          country: submission.country,
          website: submission.website,
          industryCategory: submission.industryCategory,
          annualRevenue: submission.annualRevenue,
          annualRevenueCustom: submission.annualRevenueCustom,
          yearsInBusiness: submission.yearsInBusiness,
          currentExportMarkets: submission.currentExportMarkets,
          halalCert: submission.halalCert,
          sfdaStatus: submission.sfdaStatus,
          frozenStorage: submission.frozenStorage,
          shelfLife: submission.shelfLife,
          otherCerts: submission.otherCerts,
          otherCertsCustom: submission.otherCertsCustom,
          labelLanguages: submission.labelLanguages,
          productAdaptability: submission.productAdaptability,
          brandApproach: submission.brandApproach,
          leadTimes: submission.leadTimes,
          gccCurrentlyActive: submission.gccCurrentlyActive,
          currentGccMarkets: submission.currentGccMarkets,
          gccSituation: submission.gccSituation,
          targetMarketPotential: submission.targetMarketPotential,
          targetMarketPotentialOther: submission.targetMarketPotentialOther,
          salesChannels: submission.salesChannels,
          channelStrategy: submission.channelStrategy,
          moq: submission.moq,
          exportContact: submission.exportContact,
          productionCapacity: submission.productionCapacity,
          contactFullName: submission.contactFullName,
          contactTitle: submission.contactTitle,
          contactEmail: submission.contactEmail,
          contactPhone: submission.contactPhone,
          anythingElse: submission.anythingElse,
        },
      });

      return res.status(201).json(toDto(customer));
    } catch (err) {
      next(err);
    }
  }
);

// ── Helpers ──────────────────────────────────────────────────────────────

function toDto(c: any): CustomerDto {
  return {
    id: c.id,
    submissionId: c.submissionId,
    companyName: c.companyName,
    country: c.country,
    website: c.website ?? undefined,
    industryCategory: c.industryCategory,
    annualRevenue: c.annualRevenue ?? undefined,
    yearsInBusiness: c.yearsInBusiness ?? undefined,
    currentExportMarkets: c.currentExportMarkets ?? undefined,
    annualRevenueCustom: c.annualRevenueCustom ?? undefined,
    halalCert: c.halalCert ?? undefined,
    sfdaStatus: c.sfdaStatus ?? undefined,
    frozenStorage: c.frozenStorage ?? undefined,
    shelfLife: c.shelfLife ?? undefined,
    otherCerts: c.otherCerts ?? [],
    otherCertsCustom: c.otherCertsCustom ?? undefined,
    labelLanguages: c.labelLanguages ?? undefined,
    productAdaptability: c.productAdaptability ?? undefined,
    brandApproach: c.brandApproach ?? undefined,
    leadTimes: c.leadTimes ?? undefined,
    gccCurrentlyActive: c.gccCurrentlyActive ?? undefined,
    currentGccMarkets: c.currentGccMarkets ?? [],
    gccSituation: c.gccSituation ?? undefined,
    targetMarketPotential: c.targetMarketPotential ?? undefined,
    targetMarketPotentialOther: c.targetMarketPotentialOther ?? undefined,
    salesChannels: c.salesChannels ?? [],
    channelStrategy: c.channelStrategy ?? undefined,
    moq: c.moq ?? undefined,
    exportContact: c.exportContact ?? undefined,
    productionCapacity: c.productionCapacity ?? undefined,
    contactFullName: c.contactFullName,
    contactTitle: c.contactTitle ?? undefined,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone ?? undefined,
    anythingElse: c.anythingElse ?? undefined,
    onboardingDate: c.onboardingDate.toISOString(),
    customerStatus: c.customerStatus,
    notes: c.notes ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}