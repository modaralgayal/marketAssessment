import { execSync } from "node:child_process";

/**
 * Sync the test database schema before the suite runs. Creates the new
 * `Lead`/`LeadFile` tables (and updates `ReportRequest` with `consent`).
 *
 * Requires a reachable Postgres at DATABASE_URL (see test/setup.ts). If the DB
 * is unavailable the suite still loads; only the DB-touching assertions fail,
 * with a clear warning here.
 */
export async function setup() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mea_test";
  process.env.DATABASE_URL = dbUrl;
  try {
    // `--skip-generate` removed: db push regenerates the client so the
    // generated types stay in sync with the schema (Lead model, ReportRequest
    // consent) without a separate manual `prisma generate` step.
    execSync("npx prisma db push --force-reset --accept-data-loss", {
      stdio: "inherit",
      env: process.env,
    });
  } catch (e) {
    console.warn(
      "[test/globalSetup] prisma db push failed — tests that touch the DB will error.\n" +
        "Provide a test Postgres via TEST_DATABASE_URL. (" +
        (e as Error).message +
        ")",
    );
  }
}

export async function teardown() {}
