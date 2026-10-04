import { z } from "zod";
import { optionalText } from "./submission";

/**
 * Public marketing-site lead forms.
 *
 * Three HTML form templates (exporting, sourcing, organization) all POST to a
 * single `/api/leads` endpoint, discriminated by `kind`. We model them as one
 * `Lead` Prisma model (see schema.prisma) and validate them with a Zod
 * discriminated union here, so each variant enforces only the fields it shows.
 *
 * Field names/values are taken from the rendered HTML prototype (the source of
 * truth), which is richer than the JSON content export: exporting vs sourcing
 * are two distinct templates. The sourcing product document is an optional file
 * upload (the prototype does not collect a link).
 *
 * Shared cross-cutting rules:
 *  - `consent` must be exactly `true` (GDPR consent captured client-side and
 *    re-checked server-side).
 *  - `BOT_FIELD` is a honeypot. It is never stored; the route rejects any
 *    submission that fills it. Zod strips unknown keys, so it never reaches
 *    the schema — the route checks `req.body[BOT_FIELD]` directly.
 *  - The exporting form's email is submitted as `workEmail` in the prototype;
 *    the route normalises that to `email` before validation.
 *  - `targetMarket` (exporting) and `sourceCountries` (sourcing) are arrays of
 *    country codes (the prototype renders them as multi-selects), not enums.
 */

/** Hidden honeypot field name. The route rejects any submission that fills it. */
export const BOT_FIELD = "hp";

export const LEAD_KIND_OPTIONS = [
  { value: "EXPORTING", label: "Exporting" },
  { value: "SOURCING", label: "Sourcing" },
  { value: "ORGANIZATION", label: "Organization" },
] as const;

// File upload constraints for the SOURCING product document. A subset of
// `FILE_CONSTRAINTS` from submission.ts, with .txt allowed (the form accepts it).
export const LEAD_FILE_CONSTRAINTS = {
  maxBytes: 25 * 1024 * 1024, // 25 MB
  maxFiles: 1,
  allowedExtensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt"],
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "text/plain",
  ],
} as const;

const requiredText = (field: string) =>
  z.string().trim().min(1, `${field} is required`).max(2000);

const emailField = z.string().trim().min(1, "Email is required").email("Enter a valid email");

const consentField = z.boolean().refine((v) => v === true, { message: "You must accept the privacy policy" });

// Optional product-document link. The HTML prototype only collects a file
// upload for sourcing, but a link is accepted if supplied (the upload itself is
// validated by the route via `LEAD_FILE_CONSTRAINTS`). Empty string → undefined.
const productDocumentLinkField = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Exporting lead: company, contact, a single product line and target markets. */
export const exportingLeadSchema = z.object({
  kind: z.literal("EXPORTING"),
  companyName: requiredText("Company name"),
  country: requiredText("Country"),
  fullName: requiredText("Full name"),
  email: emailField,
  website: requiredText("Website"),
  product: requiredText("Product"),
  targetMarket: z.array(z.string()).min(1, "Select at least one target market"),
  consent: consentField,
});

/** Sourcing lead: company, products, source countries and an optional product document upload. */
export const sourcingLeadSchema = z.object({
  kind: z.literal("SOURCING"),
  companyName: requiredText("Company name"),
  country: requiredText("Country"),
  website: optionalText,
  products: requiredText("Products"),
  sourceCountries: z.array(z.string()).min(1, "Select at least one country you want to source from"),
  fullName: requiredText("Full name"),
  email: emailField,
  phone: requiredText("Phone number"),
  details: optionalText,
  productDocumentLink: productDocumentLinkField,
  consent: consentField,
});

/** Organization lead: contact + org details + multi-select support options. */
export const orgLeadSchema = z.object({
  kind: z.literal("ORGANIZATION"),
  fullName: requiredText("Full name"),
  email: emailField,
  jobTitle: optionalText,
  organizationName: requiredText("Organization name"),
  // Content-driven: the value comes straight from the form's select options.
  organizationType: z.string().trim().min(1, "Select an organization type"),
  country: requiredText("Country"),
  // Content-driven: values come straight from the form's checkboxes.
  support: z.array(z.string()).min(1, "Select at least one option"),
  priorities: optionalText,
  consent: consentField,
});

/** Single entry point: validates any of the three lead kinds by `kind`. */
export const leadSchema = z.discriminatedUnion("kind", [
  exportingLeadSchema,
  sourcingLeadSchema,
  orgLeadSchema,
]);

export type LeadInput = z.infer<typeof leadSchema>;
export type ExportingLeadInput = z.infer<typeof exportingLeadSchema>;
export type SourcingLeadInput = z.infer<typeof sourcingLeadSchema>;
export type OrgLeadInput = z.infer<typeof orgLeadSchema>;

/** Lead kind discriminator — mirrors the Prisma `LeadKind` enum. */
export const LEAD_KIND_VALUES = ["EXPORTING", "SOURCING", "ORGANIZATION"] as const;
export type LeadKind = (typeof LEAD_KIND_VALUES)[number];

/** Shape returned by the admin API for a lead file. */
export interface LeadFileDto {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

/**
 * Shape returned by the admin API for a lead. Leads are the renewed marketing
 * site's public enquiries (exporting / sourcing / organization) and are kept
 * entirely separate from the assessment `Submission` records.
 */
export interface LeadDto {
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
  createdAt: string;
  files: LeadFileDto[];
}
