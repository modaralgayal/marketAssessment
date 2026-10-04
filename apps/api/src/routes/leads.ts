import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import rateLimit from "express-rate-limit";
import { Prisma } from "@prisma/client";
import { leadSchema, BOT_FIELD, LEAD_FILE_CONSTRAINTS, type LeadKind, type LeadDto } from "@mea/shared";
import { prisma } from "../prisma.js";
import { storage } from "../storage/index.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../env.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const leadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LEAD_FILE_CONSTRAINTS.maxBytes, files: LEAD_FILE_CONSTRAINTS.maxFiles },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = (LEAD_FILE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext);
    const okMime = (LEAD_FILE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(file.mimetype);
    if (okExt || okMime) cb(null, true);
    else cb(new Error(`Unsupported file type: ${file.originalname}`));
  },
});

// Public, non-invite-gated. Throttle to keep abuse/spam down.
const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this IP, please try again later." },
});

/** Escape user-supplied values before interpolating them into an HTML email body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function leadSummary(kind: string, data: Record<string, unknown>): string {
  const lines: string[] = [`New ${kind} lead received.`, ""];
  for (const [k, v] of Object.entries(data)) {
    if (k === "consent" || k === "kind") continue;
    if (v === undefined || v === null || v === "") continue;
    const val = Array.isArray(v) ? v.join(", ") : String(v);
    lines.push(`${k}: ${val}`);
  }
  lines.push("", `Open in admin: ${env.WEB_ORIGIN}/admin`);
  return lines.join("\n");
}

/**
 * Public lead intake. Accepts either:
 *  - application/json: the lead fields as the JSON body, or
 *  - multipart/form-data: a `payload` field (JSON string) plus an optional
 *    `productDocument` file. multer passes non-multipart requests straight
 *    through, so `express.json()`-parsed bodies work too.
 */
leadsRouter.post("/", leadLimiter, upload.single("productDocument"), async (req, res, next) => {
  try {
    // Honeypot: bots fill hidden fields. Reject silently (no row created).
    if (req.body[BOT_FIELD]) {
      return res.status(400).json({ error: "Submission rejected." });
    }

    const rawObj =
      typeof req.body.payload === "string"
        ? JSON.parse(req.body.payload)
        : req.body ?? {};
    const obj = rawObj as Record<string, unknown>;

    // The exporting form submits its email as `workEmail`; normalise it to the
    // canonical `email` field the schema validates.
    if (typeof obj.workEmail === "string" && obj.workEmail) {
      obj.email = obj.email || obj.workEmail;
      delete obj.workEmail;
    }

    const sourcePage =
      typeof obj.sourcePage === "string" ? obj.sourcePage : req.get("referer") ?? null;

    const data = leadSchema.parse(obj);

    // The SOURCING product document is an optional file upload (per the HTML
    // prototype) — handled out-of-band below if `req.file` is present.
    const lead = await prisma.lead.create({
      data: {
        kind: data.kind,
        sourcePage,
        fullName: data.fullName ?? null,
        email: data.email ?? null,
        consent: true,
        status: "NEW",
        ...("phone" in data ? { phone: data.phone ?? null } : {}),
        ...("companyName" in data ? { companyName: data.companyName ?? null } : {}),
        ...("country" in data ? { country: data.country ?? null } : {}),
        ...("website" in data ? { website: data.website ?? null } : {}),
        ...("product" in data ? { product: data.product ?? null } : {}),
        ...("targetMarket" in data ? { targetMarket: data.targetMarket ?? null } : {}),
        ...("organizationName" in data ? { organizationName: data.organizationName ?? null } : {}),
        ...("organizationType" in data ? { organizationType: data.organizationType ?? null } : {}),
        ...("jobTitle" in data ? { jobTitle: data.jobTitle ?? null } : {}),
        ...("support" in data ? { support: data.support } : {}),
        ...("priorities" in data ? { priorities: data.priorities ?? null } : {}),
        ...("sourceCountries" in data ? { sourceCountries: data.sourceCountries } : {}),
        ...("products" in data ? { products: data.products ?? null } : {}),
        ...("details" in data ? { details: data.details ?? null } : {}),
        ...("productDocumentLink" in data
          ? { productDocumentLink: data.productDocumentLink ?? null }
          : {}),
      },
    });

    // Persist an uploaded product document (SOURCING) to object storage.
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const key = `leads/${lead.id}/${randomUUID()}${ext}`;
      await storage.put(key, req.file.buffer, req.file.mimetype);
      await prisma.leadFile.create({
        data: {
          leadId: lead.id,
          storageKey: key,
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          sizeBytes: req.file.size,
        },
      });
    }

    // Best-effort notification. A lead is still saved even if email fails.
    let emailSent = false;
    try {
      await sendMail({
        to: env.REPORT_RECIPIENT_EMAIL,
        subject: `New ${data.kind} lead from ${data.fullName ?? data.email ?? "website"}`,
        text: leadSummary(data.kind, { ...data, sourcePage } as Record<string, unknown>),
        html: `<h2>New ${escapeHtml(data.kind)} lead</h2><pre>${escapeHtml(
          leadSummary(data.kind, { ...data, sourcePage } as Record<string, unknown>),
        )}</pre>`,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error("[lead] email failed:", (mailErr as Error).message);
    }

    return res.status(201).json({ id: lead.id, emailSent });
  } catch (err) {
    next(err);
  }
});

/** Map a Prisma `Lead` (with files) onto the admin-facing DTO. */
function toLeadDto(l: {
  id: string;
  kind: LeadKind;
  sourcePage: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  country: string | null;
  website: string | null;
  product: string | null;
  targetMarket: string[];
  organizationName: string | null;
  organizationType: string | null;
  jobTitle: string | null;
  support: string[];
  priorities: string | null;
  sourceCountries: string[];
  products: string | null;
  details: string | null;
  productDocumentLink: string | null;
  consent: boolean;
  status: string;
  createdAt: Date;
  files: { id: string; originalName: string; contentType: string; sizeBytes: number; createdAt: Date }[];
}): LeadDto {
  return {
    id: l.id,
    kind: l.kind,
    sourcePage: l.sourcePage,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone,
    companyName: l.companyName,
    country: l.country,
    website: l.website,
    product: l.product,
    targetMarket: l.targetMarket,
    organizationName: l.organizationName,
    organizationType: l.organizationType,
    jobTitle: l.jobTitle,
    support: l.support,
    priorities: l.priorities,
    sourceCountries: l.sourceCountries,
    products: l.products,
    details: l.details,
    productDocumentLink: l.productDocumentLink,
    consent: l.consent,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    files: l.files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      contentType: f.contentType,
      sizeBytes: f.sizeBytes,
      createdAt: f.createdAt.toISOString(),
    })),
  };
}

/**
 * Admin: list leads. Optional `?kind=EXPORTING|SOURCING|ORGANIZATION` filter.
 * Kept separate from assessment submissions so the two intake streams don't mix.
 */
leadsRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const kindParam = typeof req.query.kind === "string" ? req.query.kind : undefined;
    const where = kindParam ? { kind: kindParam as LeadKind } : {};
    const leads = await prisma.lead.findMany({
      where: where as Prisma.LeadWhereInput,
      orderBy: { createdAt: "desc" },
      include: { files: true },
    });
    const items = leads.map(toLeadDto);
    return res.json({ total: items.length, items });
  } catch (err) {
    next(err);
  }
});

/** Admin: single lead (with files). */
leadsRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: { files: true },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    return res.json(toLeadDto(lead));
  } catch (err) {
    next(err);
  }
});
