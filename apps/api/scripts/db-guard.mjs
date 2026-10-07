// Guard that runs BEFORE `prisma migrate dev` (the `db:migrate` script).
//
// `prisma migrate dev` resets the database on schema drift — it drops every
// table and recreates it empty, which deletes all rows. That is safe only
// against a throwaway LOCAL dev database. It is catastrophic against a
// shared/remote database like Supabase, where real data lives.
//
// This guard exits non-zero (so the `&&`-chained `prisma migrate dev` never
// runs) whenever DATABASE_URL points at anything other than a local host.
//
// To apply migrations on a remote DB, use `db:deploy` instead:
//   npm run db:deploy -w @mea/api        (migrate deploy — never resets)
// See CLAUDE.md "Database migrations" for resolving genuine drift safely.

import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[db-guard] DATABASE_URL is not set. Refusing `prisma migrate dev`.");
  process.exit(1);
}

let host = "";
try {
  host = new URL(url).hostname;
} catch {
  console.error("[db-guard] Cannot parse DATABASE_URL host. Refusing `prisma migrate dev` (unknown DB).");
  process.exit(1);
}

// Hosts that are acceptable for a destructive, resetting migration.
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres", // docker-compose default service name
  "db",
  "host.docker.internal",
]);

if (LOCAL_HOSTS.has(host)) {
  process.exit(0); // local dev DB — safe to run migrate dev
}

console.error(
  [
    `[db-guard] REFUSING to run \`prisma migrate dev\`.`,
    `  DATABASE_URL points to a remote/shared host: ${host}`,
    `  \`migrate dev\` resets the database on schema drift and would DROP ALL ROWS.`,
    ``,
    `  Use a data-safe command instead:`,
    `    npm run db:deploy -w @mea/api     # applies pending migrations, never drops data`,
    ``,
    `  If you have genuine schema drift on this DB, do NOT reset it. Resolve it via the`,
    `  safe diff→deploy path documented in CLAUDE.md ("Database migrations").`,
  ].join("\n")
);
process.exit(1);
