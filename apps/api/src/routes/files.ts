import { Router } from "express";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const filesRouter = Router();

/** Admin: return a short-lived signed URL to download a catalogue file. */
filesRouter.get("/:id/download", requireAdmin, async (req, res, next) => {
  try {
    const file = await prisma.submissionFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ error: "File not found" });
    const url = await storage.getSignedUrl(file.storageKey, 300);
    return res.json({ url, originalName: file.originalName });
  } catch (err) {
    next(err);
  }
});
