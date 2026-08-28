import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { customerSchema, FILE_CONSTRAINTS, type CustomerDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const customersRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_CONSTRAINTS.maxBytes, files: FILE_CONSTRAINTS.maxFiles },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = (FILE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
    const okMime = (FILE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(file.mimetype);
    if (okExt || okMime) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.originalname}`));
  },
});

const onboardingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this IP, please try again later." },
});

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
      include: { files: true },
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
          category: "POTENTIAL", // converted submissions land in the triage bucket
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

/** Admin: fetch the customer created from a given submission (404 if none). */
customersRouter.get(
  "/from-submission/:submissionId",
  requireAdmin,
  async (req, res, next) => {
    try {
      const customer = await prisma.customer.findUnique({
        where: { submissionId: req.params.submissionId },
        include: { files: true },
      });
      if (!customer) return res.status(404).json({ error: "No customer for this submission" });
      return res.json(toDto(customer));
    } catch (err) {
      next(err);
    }
  }
);

// ── Public onboarding (already-acquired clients submit the same form) ──────
// Gated by a single-use ONBOARDING invite; creates a Customer directly
// (category defaults to POTENTIAL) and stores the uploaded catalogue files.

customersRouter.post(
  "/from-onboarding",
  onboardingLimiter,
  upload.array("files"),
  async (req, res, next) => {
    try {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one catalogue / price list file is required." });
      }

      // Invite-only: a valid, unused ONBOARDING invite token is required.
      const inviteToken = typeof req.body.invite === "string" ? req.body.invite : "";
      if (!inviteToken) {
        return res.status(403).json({ error: "This onboarding link is invalid or missing." });
      }
      const invite = await prisma.invite.findUnique({ where: { token: inviteToken } });
      if (!invite || invite.status !== "PENDING" || invite.purpose !== "ONBOARDING") {
        return res
          .status(403)
          .json({ error: "This onboarding link is invalid or has already been used." });
      }

      const rawPayload = req.body.payload;
      if (typeof rawPayload !== "string") {
        return res.status(400).json({ error: "Missing form payload." });
      }
      const data = customerSchema.parse(JSON.parse(rawPayload));

      // Create the customer first so we have an id for the storage keys.
      const customer = await prisma.customer.create({
        data: { ...data, category: "POTENTIAL" },
      });

      // Upload files to object storage, then persist their metadata. If any
      // upload fails, clean up the orphaned customer.
      try {
        const fileRows = [];
        for (const file of files) {
          const key = `customers/${customer.id}/${randomUUID()}${path.extname(file.originalname)}`;
          await storage.put(key, file.buffer, file.mimetype);
          fileRows.push({
            customerId: customer.id,
            storageKey: key,
            originalName: file.originalName,
            contentType: file.mimetype,
            sizeBytes: file.size,
          });
        }
        await prisma.customerFile.createMany({ data: fileRows });

        // Consume the invite so the link can't be reused.
        await prisma.invite
          .update({ where: { id: invite.id }, data: { status: "USED", usedAt: new Date() } })
          .catch(() => {});
      } catch (uploadErr) {
        await prisma.customer.delete({ where: { id: customer.id } }).catch(() => {});
        throw uploadErr;
      }

      return res.status(201).json(toDto(customer));
    } catch (err) {
      next(err);
    }
  },
);

// ── Category re-bucketing (admin moves a customer between the 3 tabs) ─────

customersRouter.patch(
  "/:id/category",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { category } = z
        .object({ category: z.enum(["CUSTOMER", "POTENTIAL", "OTHER"]) })
        .parse(req.body);
      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data: { category },
      });
      return res.json(toDto(customer));
    } catch (err) {
      next(err);
    }
  },
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
    category: c.category,
    notes: c.notes ?? undefined,
    files: (c.files ?? []).map((f: any) => ({
      id: f.id,
      originalName: f.originalName,
      contentType: f.contentType,
      sizeBytes: f.sizeBytes,
      createdAt: f.createdAt.toISOString(),
    })),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}