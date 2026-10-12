import { Router } from "express";
import { verifyIdToken } from "../lib/firebaseAdmin.js";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { bootstrapAccountSchema, type AccountDto, type AccountListDto } from "@mea/shared";

export const accountsRouter = Router();

function toDto(a: {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteToken?: string | null;
  createdAt: Date;
}): AccountDto {
  return {
    id: a.id,
    email: a.email,
    role: a.role as AccountDto["role"],
    status: a.status as AccountDto["status"],
    inviteToken: a.inviteToken ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

/** Get the authenticated account. */
accountsRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.account!.id } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    return res.json(toDto(account));
  } catch (err) {
    next(err);
  }
});

/**
 * Create the Account after a successful Firebase sign-in. Idempotent: if an
 * Account already exists for this Firebase user it is returned. Otherwise the
 * role comes from a valid ACCOUNT invite, which is then consumed.
 */
accountsRouter.post("/bootstrap", async (req, res, next) => {
  try {
    const header = req.header("authorization") ?? "";
    const match = header.match(/^Bearer (.+)$/i);
    if (!match) return res.status(401).json({ error: "Missing bearer token" });

    const decoded = await verifyIdToken(match[1]!);
    // Email verification is no longer a hard gate: email/password sign-ups are
    // allowed immediately and nudged to verify later (Firebase still sends the
    // verification email). The real security boundary is the single-use ACCOUNT
    // invite — only admin-approved requests carry one.

    const existing = await prisma.account.findUnique({ where: { firebaseUid: decoded.uid } });
    if (existing) return res.json(toDto(existing));

    const { inviteToken } = bootstrapAccountSchema.parse(req.body ?? {});
    if (!inviteToken) {
      return res
        .status(400)
        .json({ error: "An invite link is required to create an account." });
    }

    const invite = await prisma.invite.findUnique({ where: { token: inviteToken } });
    if (
      !invite ||
      invite.status !== "PENDING" ||
      invite.purpose !== "ACCOUNT" ||
      !invite.role
    ) {
      return res.status(400).json({ error: "This invite is invalid or has already been used." });
    }

    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email ?? "",
          role: invite.role as AccountDto["role"],
          status: "ACTIVE",
          inviteToken,
        },
      });
      await tx.invite.update({
        where: { token: inviteToken },
        data: { status: "USED", usedAt: new Date(), accountId: acc.id },
      });
      return acc;
    });

    return res.status(201).json(toDto(account));
  } catch (err) {
    next(err);
  }
});

/** Admin: list all self-service buyer/manufacturer accounts (with company name
 *  from the linked profile). Used by the admin "Manufacturers & Buyers" panel. */
accountsRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { role: { in: ["BUYER", "MANUFACTURER"] } },
      orderBy: { createdAt: "desc" },
      include: { manufacturerProfile: true, buyerProfile: true },
    });
    const items: AccountListDto[] = accounts.map((a) => ({
      id: a.id,
      email: a.email,
      role: a.role as AccountListDto["role"],
      status: a.status as AccountListDto["status"],
      companyName: a.manufacturerProfile?.companyName ?? a.buyerProfile?.companyName ?? null,
      createdAt: a.createdAt.toISOString(),
    }));
    return res.json({ items });
  } catch (err) {
    next(err);
  }
});
