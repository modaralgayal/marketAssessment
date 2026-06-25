import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { submissionSchema, FILE_CONSTRAINTS, type SubmissionDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const submissionsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_CONSTRAINTS.maxBytes, files: FILE_CONSTRAINTS.maxFiles },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = (FILE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
    const okMime = (FILE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(file.mimetype);
    if (okExt || okMime) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.originalname}`));
  },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this IP, please try again later." },
});

function toDto(s: Awaited<ReturnType<typeof prisma.submission.findUniqueOrThrow>> & { files: any[] }): SubmissionDto {
  const { createdAt, files, ...rest } = s as any;
  return {
    ...(rest as any),
    createdAt: createdAt.toISOString(),
    files: files.map((f: any) => ({
      id: f.id,
      originalName: f.originalName,
      contentType: f.contentType,
      sizeBytes: f.sizeBytes,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}

/** Public: create a submission with at least one uploaded file. */
submissionsRouter.post("/", submitLimiter, upload.array("files"), async (req, res, next) => {
  try {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ error: "At least one catalogue / price-list file is required." });
    }

    const rawPayload = req.body.payload;
    if (typeof rawPayload !== "string") {
      return res.status(400).json({ error: "Missing form payload." });
    }
    const data = submissionSchema.parse(JSON.parse(rawPayload));

    // Create the submission row first so we have an id for the storage keys.
    const submission = await prisma.submission.create({ data });

    // Upload files to object storage, then persist their metadata. If any
    // upload fails, clean up the orphaned submission.
    try {
      const fileRows = [];
      for (const file of files) {
        const key = `submissions/${submission.id}/${randomUUID()}${path.extname(file.originalname)}`;
        await storage.put(key, file.buffer, file.mimetype);
        fileRows.push({
          submissionId: submission.id,
          storageKey: key,
          originalName: file.originalname,
          contentType: file.mimetype,
          sizeBytes: file.size,
        });
      }
      await prisma.submissionFile.createMany({ data: fileRows });
    } catch (uploadErr) {
      await prisma.submission.delete({ where: { id: submission.id } }).catch(() => {});
      throw uploadErr;
    }

    return res.status(201).json({ id: submission.id });
  } catch (err) {
    next(err);
  }
});

/** Admin: list submissions (newest first, simple pagination). */
submissionsRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const take = Math.min(Number(req.query.limit) || 50, 100);
    const skip = Number(req.query.offset) || 0;
    const [items, total] = await Promise.all([
      prisma.submission.findMany({
        orderBy: { createdAt: "desc" },
        include: { files: true },
        take,
        skip,
      }),
      prisma.submission.count(),
    ]);
    return res.json({ total, items: items.map(toDto) });
  } catch (err) {
    next(err);
  }
});

/** Admin: full submission detail. */
submissionsRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { files: true },
    });
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    return res.json(toDto(submission));
  } catch (err) {
    next(err);
  }
});
