import { env } from "./env.js";

// Origins permitted to read API responses. localhost/127.0.0.1 are always
// allowed so local dev (web :5173 → API :3000) works; every other origin must
// be listed in the API's WEB_ORIGIN env var.
const devOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const allowedOrigins = (env.WEB_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Whether a request Origin may read API responses. Shared by the CORS
 * middleware and the error handler so that, on a failure, the error handler can
 * echo the header for allowed origins — otherwise the browser masks any 500 as a
 * CORS error and the real message is invisible.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // same-origin / non-browser (curl, health checks)
  if (allowedOrigins.includes(origin)) return true;
  if (devOrigin.test(origin)) return true;
  return false;
}
