import { config } from "dotenv";

config();

// `env.ts` validates DATABASE_URL at import time, so it must be set before the
// app is imported by a test. Use TEST_DATABASE_URL (a throwaway Postgres) or
// fall back to a local default. Nothing connects until the first query.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/mea_test";
}
