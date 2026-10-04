import { Router } from "express";
import rateLimit from "express-rate-limit";
import { reportRequestSchema, BOT_FIELD } from "@mea/shared";
import { prisma } from "../prisma.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../env.js";

export const reportRequestsRouter = Router();

/** Escape user-supplied values before interpolating them into an HTML email body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Throttle to limit abuse of the email-sending endpoint.
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});

/** Public: capture a "Request a Report" submission and notify the team. */
reportRequestsRouter.post("/", reportLimiter, async (req, res, next) => {
  try {
    // Honeypot: bots fill hidden fields. Reject silently (no row created).
    if (req.body[BOT_FIELD]) {
      return res.status(400).json({ error: "Submission rejected." });
    }

    const { subject, message, email } = reportRequestSchema.parse(req.body);

    const request = await prisma.reportRequest.create({
      data: { subject, message, email, consent: true, status: "NEW" },
    });

    // Notify the team. Email is best-effort: if SMTP isn't configured yet the
    // request is still saved (status NEW) so nothing is lost.
    let emailSent = false;
    try {
      await sendMail({
        to: env.REPORT_RECIPIENT_EMAIL,
        subject: `New Report Request — ${subject}`,
        text: [
          `A new report request was submitted.`,
          ``,
          `From: ${email}`,
          `Subject: ${subject}`,
          ``,
          `Message:`,
          message,
          ``,
          `Open in admin: ${env.WEB_ORIGIN}/admin`,
        ].join("\n"),
        html: `
          <h2>New Report Request</h2>
          <p><strong>From:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
          <p><a href="${escapeHtml(env.WEB_ORIGIN)}/admin">Open admin dashboard</a></p>
        `,
      });
      emailSent = true;
    } catch (mailErr) {
      console.error("[report-request] email failed:", (mailErr as Error).message);
    }

    return res.status(201).json({ id: request.id, emailSent });
  } catch (err) {
    next(err);
  }
});
