import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import type { PrivacyPolicyVersionDto } from "@mea/shared";

export const privacyRouter = Router();

function toDto(v: {
  version: number;
  effectiveDate: Date;
  note: string | null;
}): PrivacyPolicyVersionDto {
  return {
    version: v.version,
    effectiveDate: v.effectiveDate.toISOString(),
    note: v.note ?? null,
  };
}

/**
 * Public: the latest published privacy-policy version. Returns `{ version: 0 }`
 * (no effective date) when none has been published, so first-run sign-up has no
 * outstanding consent requirement.
 */
privacyRouter.get("/version", async (_req, res, next) => {
  try {
    const latest = await prisma.privacyPolicyVersion.findFirst({
      orderBy: { version: "desc" },
    });
    if (!latest) {
      return res.json({ version: 0, effectiveDate: null, note: null });
    }
    return res.json(toDto(latest));
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: publish a new privacy-policy version. The version number is the
 * current max + 1 (monotonic). An optional `note` describes what changed.
 */
privacyRouter.post("/version", requireAdmin, auditLog, async (req, res, next) => {
  try {
    const top = await prisma.privacyPolicyVersion.findFirst({
      orderBy: { version: "desc" },
    });
    const nextVersion = (top?.version ?? 0) + 1;
    const note =
      typeof req.body?.note === "string" && req.body.note.trim()
        ? req.body.note.trim().slice(0, 280)
        : null;
    const created = await prisma.privacyPolicyVersion.create({
      data: { version: nextVersion, note },
    });
    return res.status(201).json(toDto(created));
  } catch (err) {
    next(err);
  }
});
