// Guardrail for `prisma migrate dev` (a.k.a. `npm run db:migrate`).
//
// `prisma migrate dev` RESETS the database on schema drift: it drops every table
// and recreates it empty, deleting ALL rows. Against the shared cloud DB
// (Supabase) that is a data-wipe. This guard hard-fails unless DATABASE_URL
// points at a LOCAL Postgres, so the reset can only ever fire against a
// throwaway local database.
//
// `npm run db:deploy` (`prisma migrate deploy`) does NOT reset and is NOT guarded
// — use it for Supabase/prod.

import "dotenv/config";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[db-guard] DATABASE_URL is not set. Refusing to run `prisma migrate dev`.");
  process.exit(1);
}

let host = "";
try {
  host = new URL(url).hostname;
} catch {
  console.error(`[db-guard] Could not parse DATABASE_URL host: ${url}`);
  process.exit(1);
}

// Loopback + local-docker hostnames only. Cloud hosts (e.g. *.supabase.co,
// *.rds.amazonaws.com, render databases) are rejected.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);

if (!LOCAL_HOSTS.has(host)) {
  console.error(
    `\n[db-guard] REFUSING to run \`prisma migrate dev\` against a non-local database.\n` +
      `  DATABASE_URL host = "${host}"\n` +
      `  \`migrate dev\` would RESET (drop + recreate) the database and delete all data.\n` +
      `  Run it only against a local Postgres. For Supabase/prod use \`npm run db:deploy\`\n` +
      `  (which applies migrations WITHOUT a reset).\n`,
  );
  process.exit(1);
}

console.log(`[db-guard] DATABASE_URL host "${host}" is local — allowing \`prisma migrate dev\`.`);
