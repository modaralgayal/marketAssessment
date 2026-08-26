import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { env } from "../env.js";

export const invitesRouter = Router();

const createSchema = z.object({
  email: z.string().email().optional(),
});

/** Build the public assessment URL that carries this invite token. */
function inviteLink(token: string): string {
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
    return res.json({ valid: true });
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
      items: items.map((i) => ({ ...i, link: inviteLink(i.token) })),
    });
  } catch (err) {
    next(err);
  }
});

/** Admin: create a single-use invite and return its link. */
invitesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { email } = createSchema.parse(req.body ?? {});
    const token = randomBytes(24).toString("base64url"); // ~32 chars, URL-safe, unguessable
    const invite = await prisma.invite.create({
      data: { token, email: email ?? null, status: "PENDING" },
    });
    return res.status(201).json({ ...invite, link: inviteLink(invite.token) });
  } catch (err) {
    next(err);
  }
});
