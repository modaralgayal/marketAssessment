import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { env } from "../env.js";

export const invitesRouter = Router();

const createSchema = z.object({
  email: z.string().email().optional(),
  // OPPORTUNITY → creates a Submission; ONBOARDING → creates a Customer directly.
  // ACCOUNT → bootstraps a self-service buyer/manufacturer Account (role required).
  purpose: z.enum(["OPPORTUNITY", "ONBOARDING", "ACCOUNT"]).optional(),
  // Required when purpose === "ACCOUNT"; the role the new Account gets.
  role: z.enum(["BUYER", "MANUFACTURER", "ADMIN"]).optional(),
});

/** Build the public URL that carries this invite token.
 *  - ACCOUNT invites land on the signup flow (role-scoped dashboard).
 *  - Everything else lands on the existing assessment form. */
function inviteLink(token: string, purpose?: string | null): string {
  if (purpose === "ACCOUNT") return `${env.WEB_ORIGIN}/signup?invite=${token}`;
  return `${env.WEB_ORIGIN}/assessment?invite=${token}`;
}

/**
 * Public: validate a token for the SPA gate. Returns 200 { valid: true } for a
 * live (PENDING) token, otherwise 404 { valid: false, reason }.
 */
invitesRouter.get("/validate", async (req, res, next) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) return res.status(400).json({ valid: false, reason: "missing" });

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.status !== "PENDING") {
      return res
        .status(404)
        .json({ valid: false, reason: invite ? invite.status : "not_found" });
    }
    return res.json({ valid: true, purpose: invite.purpose, role: invite.role ?? undefined });
  } catch (err) {
    next(err);
  }
});

/** Admin: list invites newest-first. */
invitesRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const items = await prisma.invite.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json({
      items: items.map((i) => ({ ...i, link: inviteLink(i.token, i.purpose) })),
    });
  } catch (err) {
    next(err);
  }
});

/** Admin: create a single-use invite and return its link. */
invitesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { email, purpose, role } = createSchema.parse(req.body ?? {});
    if (purpose === "ACCOUNT" && !role) {
      return res
        .status(400)
        .json({ error: "An ACCOUNT invite requires a role (BUYER or MANUFACTURER)." });
    }
    const token = randomBytes(24).toString("base64url"); // ~32 chars, URL-safe, unguessable
    const resolvedPurpose = purpose ?? "OPPORTUNITY";
    const invite = await prisma.invite.create({
      data: {
        token,
        email: email ?? null,
        status: "PENDING",
        purpose: resolvedPurpose,
        role: resolvedPurpose === "ACCOUNT" ? role! : null,
      },
    });
    return res.status(201).json({ ...invite, link: inviteLink(invite.token, invite.purpose) });
  } catch (err) {
    next(err);
  }
});

/** Admin: delete a single invite (e.g. a mistaken/ unused link). */
invitesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.invite.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});
