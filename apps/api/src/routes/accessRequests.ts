import { Router } from "express";
import { randomBytes } from "node:crypto";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { webBaseUrl } from "../env.js";
import { sendMail } from "../lib/mailer.js";
import {
  createAccessRequestSchema,
  approveAccessRequestSchema,
  type AccessRequestDto,
} from "@mea/shared";

export const accessRequestsRouter = Router();

function toDto(r: {
  id: string;
  name: string;
  email: string;
  company: string | null;
  intendedRole: string;
  message: string | null;
  status: string;
  inviteToken: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AccessRequestDto {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company ?? undefined,
    intendedRole: r.intendedRole as AccessRequestDto["intendedRole"],
    message: r.message ?? undefined,
    status: r.status as AccessRequestDto["status"],
    inviteToken: r.inviteToken ?? null,
    reviewedBy: r.reviewedBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** Public: a visitor (buyer or manufacturer) requests an account. No auth. */
accessRequestsRouter.post("/", async (req, res, next) => {
  try {
    const data = createAccessRequestSchema.parse(req.body ?? {});
    const created = await prisma.accessRequest.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        intendedRole: data.intendedRole,
        message: data.message ?? null,
      },
    });
    return res.status(201).json(toDto(created));
  } catch (err) {
    next(err);
  }
});

/** Admin: list requests newest-first. */
accessRequestsRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.accessRequest.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ items: items.map(toDto) });
  } catch (err) {
    next(err);
  }
});

function inviteLink(token: string): string {
  return `${webBaseUrl}/signup?accountInvite=${token}`;
}

/**
 * Admin: approve a PENDING request. Mints a single-use ACCOUNT invite carrying
 * the (possibly overridden) role, emails the invite link to the requester, and
 * marks the request APPROVED. The invite is always created even if the email
 * send fails — the returned `link` lets the admin forward it manually.
 */
accessRequestsRouter.post("/:id/approve", requireAdmin, async (req, res, next) => {
  try {
    const { role } = approveAccessRequestSchema.parse(req.body ?? {});
    const request = await prisma.accessRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}.` });
    }

    const resolvedRole = role ?? request.intendedRole;
    const token = randomBytes(24).toString("base64url");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invite.create({
        data: {
          token,
          email: request.email,
          status: "PENDING",
          purpose: "ACCOUNT",
          role: resolvedRole,
        },
      });
      return tx.accessRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          inviteToken: token,
          reviewedBy: req.admin!.email,
        },
      });
    });

    const link = inviteLink(token);
    let emailSent = false;
    try {
      await sendMail({
        to: request.email,
        subject: "Your Tradelomacy workspace invite",
        text:
          `Hi ${request.name},\n\n` +
          `Your request for a ${resolvedRole === "BUYER" ? "buyer" : "manufacturer"} workspace ` +
          `has been approved. Create your account here:\n\n${link}\n\n` +
          `This invite link is single-use.`,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error("[accessRequests] invite email failed to send:", mailErr);
    }

    return res.json({ ...toDto(updated), link, emailSent });
  } catch (err) {
    next(err);
  }
});

/** Admin: reject a PENDING request. */
accessRequestsRouter.post("/:id/reject", requireAdmin, async (req, res, next) => {
  try {
    const request = await prisma.accessRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: `Request is already ${request.status.toLowerCase()}.` });
    }
    const updated = await prisma.accessRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", reviewedBy: req.admin!.email },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});
