import { execSync } from "node:child_process";
import { URL } from "node:url";

/**
 * Resolves and provisions the database used by the test suite.
 *
 * SAFETY — the test suite must NEVER touch a real database:
 *  - The repo's `DATABASE_URL` (apps/api/.env) points at **Supabase** (the shared
 *    dev DB). It is intentionally IGNORED here so a leaked `DATABASE_URL` can never
 *    become the test DB.
 *  - The test DB is taken ONLY from `TEST_DATABASE_URL`, falling back to a
 *    localhost default.
 *  - The schema is provisioned with a NON-DESTRUCTIVE `prisma db push` (no
 *    `--force-reset`), and only against a localhost URL. The localhost check is
 *    the safety boundary: pointing TEST_DATABASE_URL at Supabase/prod produces a
 *    warning and no schema work. We deliberately never run the destructive reset
 *    during tests, so the Prisma AI guard (which blocks `db push --force-reset`
 *    when invoked by an agent) never needs to be satisfied.
 *
 * See docs/deployment.md.
 */

const LOCAL_DEFAULT = "postgresql://postgres:postgres@localhost:5432/mea_test";

function isLocalhost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export async function setup() {
  // Only honor an explicit TEST_DATABASE_URL (or a localhost default). Never the
  // project's DATABASE_URL (Supabase dev DB) — that must stay out of the tests.
  const dbUrl = process.env.TEST_DATABASE_URL || LOCAL_DEFAULT;

  let hostname = "";
  try {
    hostname = new URL(dbUrl).hostname;
  } catch {
    // Invalid URL → treated as non-localhost below and refused.
  }

  if (!isLocalhost(hostname)) {
    console.warn(
      "[test/globalSetup] Refusing to provision a non-localhost test database " +
        `(${hostname || dbUrl}).\n` +
        "Tests that touch the DB will fail to connect. The test DB must be a " +
        `localhost Postgres — e.g. ${LOCAL_DEFAULT} — set via TEST_DATABASE_URL.`,
    );
    // Surface the URL so connection errors are obvious, but do NOT run the
    // schema push anywhere but localhost.
    process.env.DATABASE_URL = dbUrl;
    return;
  }

  process.env.DATABASE_URL = dbUrl;
  try {
    // Non-destructive schema sync (NO `--force-reset`): builds/updates the test
    // schema without wiping data. Deliberately avoids the destructive reset so
    // the test run never executes a data-destroying command — the Prisma AI
    // guardrail (which blocks `db push --force-reset` when run by an agent)
    // therefore never needs to be satisfied. The localhost refusal above is the
    // real safety boundary: this push can only ever target a local throwaway DB.
    // Tests clean up their own rows (deleteMany in beforeAll), so a full reset
    // is unnecessary.
    execSync("npx prisma db push", {
      stdio: "inherit",
      env: process.env,
    });
  } catch (e) {
    console.warn(
      "[test/globalSetup] prisma db push failed — tests that touch the DB will error.\n" +
        "Provide a reachable localhost test Postgres via TEST_DATABASE_URL. (" +
        (e as Error).message +
        ")",
    );
  }
}

export async function teardown() {}
