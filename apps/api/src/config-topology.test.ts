/**
 * Guards the deployment topology documented in docs/deployment.md.
 *
 * These are the invariants that, when violated, cause the "Google sign-in says I
 * have no account" / "which database am I talking to?" confusion:
 *
 *   1. Local web dev talks to the LOCAL api (localhost), not prod.
 *   2. The local api's dev database is Supabase (the shared dev DB) — never the
 *      prod / Render Postgres connection string.
 *   3. Dev and prod share ONE Firebase project (`market-entry-assessment`), so the
 *      backend service-account project must equal the web's VITE_FIREBASE_PROJECT_ID.
 *
 * The committed `.env.example` files encode the intended dev topology, so these
 * assertions run even in CI. When the real (gitignored) `.env` is present locally,
 * the Firebase single-project cross-check also runs.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

/** Walk up from cwd until we find the repo root (the dir holding apps/api/package.json). */
function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, "apps/api/package.json"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume cwd is apps/api and the repo root is one level up.
  return resolve(process.cwd(), "..");
}

const repoRoot = findRepoRoot();

/** Parse a simple KEY=VALUE env file (ignores comments and blank lines). */
function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** Load an app's env: prefer the real .env, then .env.development.local, then .env.example. */
function loadAppEnv(app: "web" | "api"): Record<string, string> {
  const dir = join(repoRoot, "apps", app);
  for (const name of [".env", ".env.development.local", ".env.example"]) {
    const p = join(dir, name);
    if (existsSync(p)) return parseEnv(readFileSync(p, "utf8"));
  }
  return {};
}

const hasRealApiEnv = existsSync(join(repoRoot, "apps/api/.env"));
const hasRealWebEnv = existsSync(join(repoRoot, "apps/web/.env"));
const webEnv = loadAppEnv("web");
const apiEnv = loadAppEnv("api");

describe("Deployment topology (dev vs prod wiring)", () => {
  it("local web dev targets the LOCAL api (localhost), not prod", () => {
    const base = webEnv.VITE_API_BASE_URL ?? "";
    expect(base, "VITE_API_BASE_URL should point at the local api").toMatch(
      /^https?:\/\/localhost(:\d+)?/,
    );
  });

  it("local api dev database is Supabase (the shared dev DB), not prod/Render Postgres", () => {
    const url = apiEnv.DATABASE_URL ?? "";
    expect(url, "DATABASE_URL should be Supabase for local dev").toMatch(/supabase\.(co|com)/);
    // Guard: a prod connection string must never be the dev default.
    expect(url, "dev DATABASE_URL must not point at prod/Render").not.toMatch(
      /render\.com|ondigitalocean|amazonaws\.com/i,
    );
  });

  it("committed env examples encode the dev topology", () => {
    expect(webEnv).toHaveProperty("VITE_API_BASE_URL");
    expect(apiEnv).toHaveProperty("DATABASE_URL");
  });
});

describe("Firebase project consistency (dev and prod share ONE project)", () => {
  const runLive = hasRealApiEnv && hasRealWebEnv;
  const maybe = runLive ? it : it.skip;

  maybe("backend service-account project matches the web Firebase project", () => {
    const b64 = apiEnv.FIREBASE_SERVICE_ACCOUNT_B64;
    expect(b64, "FIREBASE_SERVICE_ACCOUNT_B64 must be present").toBeTruthy();
    const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    expect(sa.project_id, "backend Firebase project must equal the web project").toBe(
      webEnv.VITE_FIREBASE_PROJECT_ID,
    );
    expect(sa.project_id, "shared Firebase project must be market-entry-assessment").toBe(
      "market-entry-assessment",
    );
  });
});
