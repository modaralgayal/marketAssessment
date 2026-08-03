/**
 * Audit-logging middleware.
 *
 * Logs every authenticated request to a structured JSON line so that
 * admin actions are traceable. No PII is logged beyond the admin's email
 * and the resource path.
 *
 * Log format (one line per request):
 *   [audit] {"ts":"<ISO>","admin":"<email>","method":"<HTTP>","path":"<url>","status":<code>}
 */

import type { Request, Response, NextFunction } from "express";

export function auditLog(req: Request, res: Response, next: NextFunction) {
  // Capture the original end so we can log AFTER the response is sent
  const originalEnd = res.end.bind(res);

  res.end = function (this: Response, ...args: any[]) {
    const admin = (req as any).admin?.email ?? "anonymous";
    const entry = {
      ts: new Date().toISOString(),
      admin,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    };
    console.log(`[audit] ${JSON.stringify(entry)}`);
    return originalEnd(...args);
  } as typeof res.end;

  next();
}