import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { isOriginAllowed } from "../lib/corsOrigin.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Echo CORS for allowed origins so the browser surfaces the REAL error instead
  // of masking every 500 as a CORS failure (which is what hid this class of bug).
  const origin = req.headers.origin;
  if (typeof origin === "string" && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", fields: err.flatten().fieldErrors });
  }
  // multer file-size / limit errors expose a `.code`
  if (typeof err === "object" && err && "code" in err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "A file exceeds the maximum allowed size" });
  }
  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
