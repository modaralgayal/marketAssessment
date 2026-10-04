import { z } from "zod";

/**
 * "Request a Report" public form schema.
 *
 * The existing `ReportRequest` model now captures GDPR `consent` (the live form
 * already collects it). The honeypot is validated by the route via `BOT_FIELD`
 * (re-exported from `./lead`); it is never stored, and Zod strips unknown keys
 * so it never reaches this schema.
 */

export const reportRequestSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Please tell us about your operation").max(5000),
  email: z.string().trim().min(1, "Email is required").email("A valid email is required"),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the privacy policy" }),
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
