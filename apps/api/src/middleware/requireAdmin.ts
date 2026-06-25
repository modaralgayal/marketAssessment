import type { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../lib/firebaseAdmin.js";
import { adminEmails } from "../env.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: { uid: string; email: string };
    }
  }
}

/**
 * Verifies the Firebase ID token in the Authorization header and checks the
 * email against the ADMIN_EMAILS allowlist. Authentication (who you are) is
 * handled by Firebase; authorization (admin or not) is the allowlist check.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const decoded = await verifyIdToken(match[1]!);
    const email = decoded.email?.toLowerCase();
    if (!email || !adminEmails.has(email)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    req.admin = { uid: decoded.uid, email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
