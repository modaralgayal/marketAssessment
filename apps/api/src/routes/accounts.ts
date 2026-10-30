import { Router } from "express";
import type { UserRecord } from "firebase-admin/auth";
import {
  verifyIdToken,
  deleteFirebaseUser,
  getFirebaseUser,
  generatePasswordResetLink,
  generateEmailVerificationLink,
} from "../lib/firebaseAdmin.js";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import { webBaseUrl } from "../env.js";
import { sendMail } from "../lib/mailer.js";
import {
  bootstrapAccountSchema,
  acceptPrivacySchema,
  type AccountDto,
  type AccountListDto,
} from "@mea/shared";

export const accountsRouter = Router();

function toDto(a: {
  id: string;
  email: string;
  role: string;
  status: string;
  inviteToken?: string | null;
  privacyAcceptedVersion?: number | null;
  privacyAcceptedAt?: Date | null;
  createdAt: Date;
}): AccountDto {
  return {
    id: a.id,
    email: a.email,
    role: a.role as AccountDto["role"],
    status: a.status as AccountDto["status"],
    inviteToken: a.inviteToken ?? null,
    privacyAcceptedVersion: a.privacyAcceptedVersion ?? null,
    privacyAcceptedAt: a.privacyAcceptedAt ? a.privacyAcceptedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}

/** The latest published privacy-policy version (0 if none). */
async function currentPrivacyVersion(): Promise<number> {
  const latest = await prisma.privacyPolicyVersion.findFirst({
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return latest?.version ?? 0;
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
 * Self-service: accept the latest published privacy-policy version (GDPR
 * Art. 7 — recorded consent). No-op if already on the latest version.
 */
accountsRouter.post("/me/privacy", requireAuth, async (req, res, next) => {
  try {
    const parsed = acceptPrivacySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const latest = await currentPrivacyVersion();
    const account = await prisma.account.update({
      where: { id: req.account!.id },
      data: { privacyAcceptedVersion: latest, privacyAcceptedAt: new Date() },
    });
    return res.json(toDto(account));
  } catch (err) {
    next(err);
  }
});

/**
 * Self-service: export the user's own data (GDPR Art. 20 — portability) as a
 * single JSON document. No secrets; the Firebase uid is excluded.
 */
accountsRouter.get("/me/export", requireAuth, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.account!.id },
      include: {
        manufacturerProfile: true,
        buyerProfile: true,
        opportunityCards: { include: { matchSuggestions: true, matchSuggestionsB: true } },
      },
    });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const latest = await currentPrivacyVersion();
    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
        privacyAcceptedVersion: account.privacyAcceptedVersion ?? null,
        privacyAcceptedAt: account.privacyAcceptedAt ?? null,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
      manufacturerProfile: account.manufacturerProfile ?? null,
      buyerProfile: account.buyerProfile ?? null,
      opportunityCards: account.opportunityCards,
      privacyPolicyVersion: latest,
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tradelomacy-data-${account.id}.json"`,
    );
    return res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
});

/**
 * Self-service: delete the user's own account (GDPR Art. 17 — erasure).
 * Irreversible: deletes the Firebase user and the Prisma Account row, which
 * cascades to the profile, opportunity cards, and match suggestions. The
 * Firebase user is deleted first; if that fails we still remove the Prisma row
 * (avoiding an orphaned auth user), and we rethrow only on Prisma failure.
 */
accountsRouter.delete("/me", requireAuth, auditLog, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.account!.id } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const firebaseUid = account.firebaseUid;
    try {
      await deleteFirebaseUser(firebaseUid);
    } catch (e) {
      // user-not-found is fine (already gone); anything else we still prune Prisma.
      console.error("[accounts] Firebase delete failed for", firebaseUid, e);
    }
    await prisma.account.delete({ where: { id: account.id } });
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * Create the Account after a successful Firebase sign-in. Idempotent: if an
 * Account already exists for this Firebase user it is returned. Otherwise the
 * role comes from a valid ACCOUNT invite, which is then consumed. If the invite
 * is accepted and `acceptPrivacy` is set, the current policy version is recorded.
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

    const { inviteToken, acceptPrivacy } = bootstrapAccountSchema.parse(req.body ?? {});
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

    const latest = await currentPrivacyVersion();
    const acceptedVersion = acceptPrivacy ? latest : null;

    const account = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email ?? "",
          role: invite.role as AccountDto["role"],
          status: "ACTIVE",
          inviteToken,
          privacyAcceptedVersion: acceptedVersion,
          privacyAcceptedAt: acceptedVersion ? new Date() : null,
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

/**
 * Admin: permanently delete an account by Prisma id (GDPR Art. 17 — erasure,
 * admin-initiated). Irreversible: deletes the Firebase user and the Prisma
 * Account row, which cascades to the profile, opportunity cards, match
 * suggestions and related records. The Firebase user is deleted first; if that
 * fails we still remove the Prisma row (avoiding an orphaned auth user), and we
 * rethrow only on Prisma failure.
 */
accountsRouter.delete("/:id", requireAdmin, auditLog, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    try {
      await deleteFirebaseUser(account.firebaseUid);
    } catch (e) {
      // user-not-found is fine (already gone); anything else we still prune Prisma.
      console.error("[accounts] Firebase delete failed for", account.firebaseUid, e);
    }
    await prisma.account.delete({ where: { id: account.id } });
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Admin: load an account (by Prisma id) together with its Firebase user. */
async function loadAccountWithFirebase(id: string): Promise<
  { account: { id: string; email: string; firebaseUid: string }; firebaseUser: UserRecord | null } | null
> {
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) return null;
  let firebaseUser: UserRecord | null = null;
  try {
    firebaseUser = await getFirebaseUser(account.firebaseUid);
  } catch {
    /* Firebase user may be missing; the Prisma row still exists */
  }
  return { account, firebaseUser };
}

/** Admin: disable an account (rejected at sign-in via requireAuth). */
accountsRouter.post("/:id/disable", requireAdmin, auditLog, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: { status: "DISABLED" },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/** Admin: re-enable a disabled account. */
accountsRouter.post("/:id/enable", requireAdmin, auditLog, async (req, res, next) => {
  try {
    const account = await prisma.account.findUnique({ where: { id: req.params.id } });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: { status: "ACTIVE" },
    });
    return res.json(toDto(updated));
  } catch (err) {
    next(err);
  }
});

/**
 * Admin: email the user a Firebase password-reset link. Google-only accounts
 * have no password, so this is rejected with a clear message.
 */
accountsRouter.post(
  "/:id/reset-password",
  requireAdmin,
  auditLog,
  async (req, res, next) => {
    try {
      const loaded = await loadAccountWithFirebase(req.params.id);
      if (!loaded) return res.status(404).json({ error: "Account not found" });
      const { account, firebaseUser } = loaded;
      const hasPassword = firebaseUser?.providerData?.some((p) => p.providerId === "password");
      if (!hasPassword) {
        return res
          .status(400)
          .json({ error: "This account signs in with Google — password reset doesn't apply." });
      }
      const link = await generatePasswordResetLink(account.email, `${webBaseUrl}/reset-password`);
      let emailSent = false;
      try {
        await sendMail({
          to: account.email,
          subject: "Reset your Tradelomacy password",
          text:
            `Hi,\n\n` +
            `An administrator reset was requested for your Tradelomacy account. ` +
            `Set a new password here:\n\n${link}\n\n` +
            `If you didn't request this, you can ignore this email.`,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("[accounts] reset-password email failed:", mailErr);
      }
      return res.json({ emailSent });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * Admin: email the user a Firebase email-verification link. Only meaningful for
 * email/password accounts; Google-only accounts are rejected.
 */
accountsRouter.post(
  "/:id/resend-verification",
  requireAdmin,
  auditLog,
  async (req, res, next) => {
    try {
      const loaded = await loadAccountWithFirebase(req.params.id);
      if (!loaded) return res.status(404).json({ error: "Account not found" });
      const { account, firebaseUser } = loaded;
      const hasPassword = firebaseUser?.providerData?.some((p) => p.providerId === "password");
      if (!hasPassword) {
        return res
          .status(400)
          .json({ error: "This account signs in with Google — verification email doesn't apply." });
      }
      const link = await generateEmailVerificationLink(account.email, `${webBaseUrl}/login`);
      let emailSent = false;
      try {
        await sendMail({
          to: account.email,
          subject: "Verify your Tradelomacy email",
          text:
            `Hi,\n\n` +
            `Please verify your email address for your Tradelomacy account:\n\n${link}\n\n` +
            `If you didn't request this, you can ignore this email.`,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error("[accounts] resend-verification email failed:", mailErr);
      }
      return res.json({ emailSent });
    } catch (err) {
      next(err);
    }
  },
);
