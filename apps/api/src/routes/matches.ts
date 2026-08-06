import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import { findMatches } from "../lib/claudeMatch.js";
import type { ManufacturerMatchDto, MatchLevel } from "@mea/shared";

export const matchesRouter = Router();

// All match routes require admin authentication
matchesRouter.use(requireAdmin);
matchesRouter.use(auditLog);

const matchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many match requests, please try again later." },
});

function toDto(m: any): ManufacturerMatchDto {
  return {
    id: m.id,
    submissionId: m.submissionId,
    distributorId: m.distributorId,
    compatibilityScore: m.compatibilityScore,
    rationale: m.rationale,
    matchLevel: m.matchLevel as MatchLevel,
    createdAt: m.createdAt.toISOString(),
    distributor: {
      id: m.distributor.id,
      companyName: m.distributor.companyName,
      cityRegion: m.distributor.cityRegion,
      channelType: m.distributor.channelType,
      sizeScale: m.distributor.sizeScale ?? undefined,
      website: m.distributor.website ?? undefined,
      phone: m.distributor.phone ?? undefined,
      email: m.distributor.email ?? undefined,
      contactPerson: m.distributor.contactPerson ?? undefined,
      doWeKnowThem: m.distributor.doWeKnowThem ?? undefined,
      statusLastContact: m.distributor.statusLastContact ?? undefined,
      description: m.distributor.description ?? undefined,
      dataTier: m.distributor.dataTier ?? 3,
      attributes: (m.distributor.attributes as Record<string, any>) ?? {},
      createdAt: m.distributor.createdAt.toISOString(),
      updatedAt: m.distributor.updatedAt.toISOString(),
    },
  };
}

/** GET /api/submissions/:id/matches — fetch all matches for a submission. */
matchesRouter.get("/:id/matches", async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const matches = await prisma.manufacturerMatch.findMany({
      where: { submissionId: req.params.id },
      include: { distributor: true },
      orderBy: { compatibilityScore: "desc" },
    });

    return res.json(matches.map(toDto));
  } catch (err) {
    next(err);
  }
});

/** POST /api/submissions/:id/match — trigger Claude matching. */
matchesRouter.post("/:id/match", matchLimiter, async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const distributorCount = await prisma.distributor.count();
    if (distributorCount === 0) {
      return res.status(400).json({ error: "No distributors in database. Import distributors first." });
    }

    // Delete any existing matches for this submission (re-run replaces them)
    await prisma.manufacturerMatch.deleteMany({ where: { submissionId: req.params.id } });

    // Call Claude to find compatible distributors
    const result = await findMatches(req.params.id);

    if (!result.matches || result.matches.length === 0) {
      return res.json({ matches: [], message: "No compatible distributors found." });
    }

    // Bulk-insert matches
    const matchRows = result.matches.map((m) => ({
      submissionId: req.params.id,
      distributorId: m.distributorId,
      compatibilityScore: m.compatibilityScore,
      rationale: m.rationale,
      matchLevel: m.matchLevel,
    }));

    await prisma.manufacturerMatch.createMany({ data: matchRows });

    // Return the newly created matches with distributor details
    const created = await prisma.manufacturerMatch.findMany({
      where: { submissionId: req.params.id },
      include: { distributor: true },
      orderBy: { compatibilityScore: "desc" },
    });

    return res.json(created.map(toDto));
  } catch (err) {
    next(err);
  }
});