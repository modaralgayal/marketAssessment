import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { auditLog } from "../middleware/auditLog.js";
import { extractCatalogueData } from "../lib/catalogueExtract.js";
import type { CatalogueExtractedData } from "@mea/shared";

export const catalogueRouter = Router();

catalogueRouter.use(requireAdmin);
catalogueRouter.use(auditLog);

const extractLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many extraction requests, please try again later." },
});

/**
 * Known schema fields for auto-mapping extracted data to assessment form fields.
 * Keys are the extracted data keys, values are the form field(s) they map to.
 */
const KNOWN_FIELD_MAP: Record<string, string[]> = {
  productCategories: ["industryCategory"],
  certifications: ["halalCert", "otherCerts"],
  contactInfo: ["contactEmail", "contactPhone", "website"],
};

const KNOWN_KEYS = new Set(Object.keys(KNOWN_FIELD_MAP));

/** Extract structured data from a submission's catalogue files. */
catalogueRouter.post("/submissions/:id/extract-catalogue", extractLimiter, async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { files: true },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.files.length === 0) {
      return res.status(400).json({ error: "No files attached to this submission." });
    }

    // Run extraction synchronously (admin-only operation, typically 2-5 seconds)
    const rawData = await extractCatalogueData(
      submission.files.map((f) => ({
        storageKey: f.storageKey,
        contentType: f.contentType,
        originalName: f.originalName,
      })),
    );

    // Compute field mapping: which keys match known schema, which are "additional"
    const fieldMapping = computeFieldMapping(rawData);

    // Store the raw data + additionalFields in the database
    const catalogueData: CatalogueExtractedData = {
      ...rawData,
      additionalFields: fieldMapping.additional.map((f) => ({
        key: f.key,
        value: f.value,
      })),
    };

    await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        catalogueData: catalogueData as any,
        catalogueExtractedAt: new Date(),
      },
    });

    return res.json({
      catalogueData,
      fieldMapping,
      catalogueExtractedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[catalogue] Extraction failed:", err.message);
    return res.status(500).json({ error: err.message ?? "Extraction failed." });
  }
});

/**
 * Persist additional data fields extracted from the catalogue.
 * Body: { additionalFields: [{ key, value }] }
 */
catalogueRouter.post("/submissions/:id/apply-catalogue-mapping", async (req, res) => {
  try {
    const { additionalFields } = req.body;
    if (!Array.isArray(additionalFields)) {
      return res.status(400).json({ error: "additionalFields array is required." });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const currentData = (submission.catalogueData as any) ?? {};

    // Validate entries
    for (const f of additionalFields) {
      if (typeof f.key !== "string" || typeof f.value !== "string") {
        return res.status(400).json({
          error: `Invalid field entry: ${JSON.stringify(f)}. Each field must have key and value.`,
        });
      }
    }

    const updatedData: CatalogueExtractedData = {
      ...currentData,
      additionalFields,
    };

    await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        catalogueData: updatedData as any,
      },
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[catalogue] Apply mapping failed:", err.message);
    return res.status(500).json({ error: err.message ?? "Failed to apply mapping." });
  }
});

// ── Field Mapping Helpers ───────────────────────────────────────────────

interface FieldMappingResult {
  matched: Array<{
    key: string;
    label: string;
    value: string | string[] | Record<string, string> | undefined;
    mapsTo: string[];
  }>;
  additional: Array<{
    key: string;
    label: string;
    value: string;
  }>;
}

function computeFieldMapping(data: CatalogueExtractedData): FieldMappingResult {
  const matched: FieldMappingResult["matched"] = [];
  const additional: FieldMappingResult["additional"] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === "additionalFields") continue;
    if (value === null || value === undefined) continue;

    if (KNOWN_KEYS.has(key)) {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      matched.push({
        key,
        label,
        value,
        mapsTo: KNOWN_FIELD_MAP[key],
      });
    } else {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      const strValue = typeof value === "string" ? value : JSON.stringify(value);
      additional.push({
        key,
        label,
        value: strValue,
      });
    }
  }

  return { matched, additional };
}

export { computeFieldMapping };