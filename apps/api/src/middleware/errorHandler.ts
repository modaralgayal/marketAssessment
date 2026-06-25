import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
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
