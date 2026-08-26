import { env } from "../env.js";

/**
 * Lazily-built SMTP transporter. Uses a dynamic import so the rest of the API
 * keeps working even if `nodemailer` has not been installed yet — only the
 * actual send path fails (with a clear error) until it is.
 */
type Transporter = import("nodemailer").Transporter;

let transporter: Transporter | null = null;
let warned = false;

async function getTransporter(): Promise<Transporter | null> {
  if (!env.SMTP_USER || !env.SMTP_PASS) return null;
  if (!transporter) {
    const mod = await import("nodemailer");
    const nodemailer = ((mod as { default?: unknown }).default as typeof mod) ?? mod;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST ?? "smtp.gmail.com",
      port: env.SMTP_PORT ?? 465,
      secure: (env.SMTP_PORT ?? 465) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Sends an email. Throws if SMTP is not configured. */
export async function sendMail(input: MailInput): Promise<void> {
  const t = await getTransporter();
  if (!t) {
    if (!warned) {
      console.warn(
        "[mailer] SMTP is not configured — set SMTP_USER and SMTP_PASS to send emails.",
      );
      warned = true;
    }
    throw new Error("SMTP is not configured.");
  }
  await t.sendMail({
    from: env.MAIL_FROM || env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
