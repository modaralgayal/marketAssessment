import { config } from "dotenv";

config();

// `env.ts` validates DATABASE_URL at import time, so it must be set before the
// app is imported by a test. globalSetup (test/globalSetup.ts) is the authority:
// it sets DATABASE_URL to TEST_DATABASE_URL (or a localhost default) and refuses
// the destructive `db push` against any non-localhost URL, so the project's
// DATABASE_URL (Supabase dev DB) never reaches the tests. If it isn't set yet,
// fall back to a localhost throwaway DB here — never to Supabase. Nothing
// connects until the first query.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/mea_test";
}
