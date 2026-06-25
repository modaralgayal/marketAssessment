import { z } from "zod";
import "dotenv/config";  // ← must be first

/**
 * Core env is validated at boot (fail fast). R2 and Firebase groups are
 * optional here so the server can start for local development / health checks
 * even before those credentials are wired up; the storage and auth modules
 * assert their own requirements when first used.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  ADMIN_EMAILS: z.string().default(""),

  // Cloudflare R2 (optional at boot)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),

  // Firebase Admin (optional at boot)
  FIREBASE_SERVICE_ACCOUNT_B64: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
