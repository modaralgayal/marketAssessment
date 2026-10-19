import type { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../lib/firebaseAdmin.js";
import { prisma } from "../prisma.js";
import type { AccountRole } from "@mea/shared";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      account?: {
        id: string;
        firebaseUid: string;
        email: string;
        role: AccountRole;
        status: string;
      };
    }
  }
}

/**
 * Verifies the Firebase ID token and loads the matching self-service Account.
 * Distinct from `requireAdmin` (which only checks the admin email allowlist):
 * this requires a real Account row to exist, i.e. the user has completed
 * invite-based sign-up.
 */
async function authenticate(req: Request, res: Response): Promise<boolean> {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) {
    res.status(401).json({ error: "Missing bearer token" });
    return false;
  }
  try {
    const decoded = await verifyIdToken(match[1]!);
    // NOTE: email_verified is intentionally NOT required here. Sign-up no longer
    // hard-gates on verification (see accounts.ts /bootstrap); an unverified
    // email/password user can still use the app and is nudged to verify later.
    // Admin auth (requireAdmin) keeps its own email_verified gate.
    const account = await prisma.account.findUnique({ where: { firebaseUid: decoded.uid } });
    if (!account) {
      res.status(403).json({ error: "Account not found. Please complete sign-up." });
      return false;
    }
    if (account.status === "DISABLED") {
      res.status(403).json({ error: "This account has been disabled." });
      return false;
    }
    req.account = {
      id: account.id,
      firebaseUid: account.firebaseUid,
      email: account.email,
      role: account.role,
      status: account.status,
    };
    return true;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return false;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (await authenticate(req, res)) next();
}

/** Like `requireAuth` but additionally restricts to the given account roles. */
export function requireRole(...roles: AccountRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!(await authenticate(req, res))) return;
    if (!req.account || !roles.includes(req.account.role)) {
      res.status(403).json({ error: "Not authorized for this area" });
      return;
    }
    next();
  };
}
