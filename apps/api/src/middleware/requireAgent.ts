import type { Request, Response, NextFunction } from "express";
import { env } from "../env.js";

/**
 * Server-to-server auth for the matchmaking agent. The agent is a backend job,
 * not a Firebase user, so it authenticates with a shared API key rather than an
 * ID token. When `MATCHMAKING_API_KEY` is unset the endpoints are unavailable.
 */
export function requireAgent(req: Request, res: Response, next: NextFunction) {
  if (!env.MATCHMAKING_API_KEY) {
    return res.status(503).json({ error: "Matchmaking is not configured" });
  }
  const key = req.header("x-api-key") ?? "";
  if (key !== env.MATCHMAKING_API_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
}
