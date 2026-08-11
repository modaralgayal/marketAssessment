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
          yearsInBusiness: submission.yearsInBusiness,
          currentExportMarkets: submission.currentExportMarkets,
          productNames: submission.productNames,
          numberOfSkus: submission.numberOfSkus,
          shelfLife: submission.shelfLife,
          exWorksPriceRange: submission.exWorksPriceRange,
          halalCert: submission.halalCert,
          otherCerts: submission.otherCerts,
          labelLanguages: submission.labelLanguages,
          targetMarkets: submission.targetMarkets,
          salesChannels: submission.salesChannels,
          timeline: submission.timeline,
          revenueYear1Target: submission.revenueYear1Target,
          revenueYear3Target: submission.revenueYear3Target,
          gccContact: submission.gccContact,
          gccContactDetails: submission.gccContactDetails,
          distributionPartner: submission.distributionPartner,
          distributionDetails: submission.distributionDetails,
          moq: submission.moq,
          exportContact: submission.exportContact,
          productionCapacity: submission.productionCapacity,
          sfdaStatus: submission.sfdaStatus,
          productAdaptability: submission.productAdaptability,
          budget: submission.budget,
          partnershipHorizon: submission.partnershipHorizon,
          brandActivation: submission.brandActivation,
          contactFullName: submission.contactFullName,
          contactTitle: submission.contactTitle,
          contactEmail: submission.contactEmail,
          contactPhone: submission.contactPhone,
          hasSigningAuthority: submission.hasSigningAuthority,
          signingAuthorityContact: submission.signingAuthorityContact,
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
    productNames: c.productNames,
    numberOfSkus: c.numberOfSkus ?? undefined,
    shelfLife: c.shelfLife ?? undefined,
    exWorksPriceRange: c.exWorksPriceRange ?? undefined,
    halalCert: c.halalCert ?? undefined,
    otherCerts: c.otherCerts ?? [],
    labelLanguages: c.labelLanguages ?? undefined,
    targetMarkets: c.targetMarkets ?? [],
    salesChannels: c.salesChannels ?? [],
    timeline: c.timeline ?? undefined,
    revenueYear1Target: c.revenueYear1Target ?? undefined,
    revenueYear3Target: c.revenueYear3Target ?? undefined,
    gccContact: c.gccContact ?? undefined,
    gccContactDetails: c.gccContactDetails ?? undefined,
    distributionPartner: c.distributionPartner ?? undefined,
    distributionDetails: c.distributionDetails ?? undefined,
    moq: c.moq ?? undefined,
    exportContact: c.exportContact ?? undefined,
    productionCapacity: c.productionCapacity ?? undefined,
    sfdaStatus: c.sfdaStatus ?? undefined,
    productAdaptability: c.productAdaptability ?? undefined,
    budget: c.budget ?? undefined,
    partnershipHorizon: c.partnershipHorizon ?? undefined,
    brandActivation: c.brandActivation ?? undefined,
    contactFullName: c.contactFullName,
    contactTitle: c.contactTitle ?? undefined,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone ?? undefined,
    hasSigningAuthority: c.hasSigningAuthority ?? undefined,
    signingAuthorityContact: c.signingAuthorityContact ?? undefined,
    anythingElse: c.anythingElse ?? undefined,
    onboardingDate: c.onboardingDate.toISOString(),
    customerStatus: c.customerStatus,
    notes: c.notes ?? undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}