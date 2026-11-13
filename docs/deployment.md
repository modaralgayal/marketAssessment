# Deployment & database topology

This document explains how the app is wired across environments, so that auth/DB
confusion (e.g. "Google sign-in says I have no account", or "which database am I
even talking to?") can be resolved from first principles instead of guesswork.

## Two databases, one schema

| | Dev / local testing | Prod |
|---|---|---|
| **Database** | **Supabase** (cloud Postgres) | **Render Postgres** |
| **Where configured** | `apps/api/.env` → `DATABASE_URL` | Render dashboard, `mea-api` service (NOT in `.env`) |
| **Data** | Dev dataset (what `/admin` shows when you run locally) | Prod dataset |

- Both databases use the **same Prisma schema** (kept in sync via committed
  migrations + `db:deploy`), but they hold **separate rows**. "Prod and dev have
  different data" is expected and correct.
- Schema changes: author migrations locally against a **throwaway local Postgres**
  with `db:migrate` (guarded — refuses remote DBs), commit the migration folder,
  then `db:deploy` to Supabase. Render runs `db:deploy` on each deploy. **Never**
  run `db:migrate` against Supabase (it resets the database).

## Frontend → API → DB wiring

**Local (`npm run dev`):**
```
web (localhost:5173)
  └─ VITE_API_BASE_URL = http://localhost:3000   (forced by apps/web/.env.development.local for `npm run dev`)
       └─ local API (apps/api, `tsx watch`) on :3000
            └─ DATABASE_URL = Supabase (dev DB)        (apps/api/.env)
```
So **local testing talks to the local API, which reads the dev (Supabase) DB**. The
accounts you see in `/admin` locally are the same rows sign-in queries.

**Prod:**
```
web (static build served by Render `mea-web`)
  └─ VITE_API_BASE_URL = prod API   (set by Render at BUILD time, overrides the repo .env)
       └─ mea-api (Render) on prod API URL
            └─ DATABASE_URL = Render Postgres   (set in Render dashboard)
```

> Rule of thumb: **the repo `.env` files encode the DEV setup.** Prod values are
> injected by Render (API `DATABASE_URL` in the dashboard; web `VITE_API_BASE_URL`
> at build). If you change a repo `.env`, you are changing DEV only.

## Firebase — one project, both environments

- A **single Firebase project**, `market-entry-assessment`, is used for **dev AND
  prod**. There is no separate dev/prod Firebase project.
- Web config (`VITE_FIREBASE_*`) and the backend service account
  (`FIREBASE_SERVICE_ACCOUNT_B64` in `apps/api/.env`) both target it.
- The backend verifies ID tokens via the Admin SDK (`verifyIdToken`).

### Accounts are keyed by `firebaseUid`, NOT by email

`requireAuth` resolves the signed-in user like this (`apps/api/src/middleware/requireAuth.ts`):

```ts
const decoded = await verifyIdToken(token); // → { uid, email, ... }
const account = await prisma.account.findUnique({ where: { firebaseUid: decoded.uid } });
```

The lookup key is the **opaque Firebase UID**, not the email. Consequences:

- A Google account's **email can stay identical while its UID changes** — e.g. the
  Firebase auth user was deleted and recreated, or the `Account` row was originally
  bound to a different auth identity (email/password vs Google).
- When that happens, sign-in still succeeds at Firebase, but the backend finds **no
  row by UID** → `403 "Account not found"` → the UI shows *"This Google account
  doesn't have a workspace in this environment yet."* The account row is real and
  `ACTIVE` — it's just keyed by a UID Google no longer mints.
- **This is the #1 cause of a previously-working Google sign-in suddenly failing
  for an existing account.** It is NOT a database-connection problem.

## Fixing a "no account" sign-in (stale `firebaseUid`)

The fix is a **non-destructive rebind** — it updates only the `firebaseUid`
column and preserves the profile, opportunity cards, conversations, and every
related row. (Do **not** delete-and-recreate the account: `Account` cascades to
profile/cards/messages.)

From `apps/api`:

```bash
# 1) Read-only: prints the stored dbUid vs the live Firebase UID for each email.
npx tsx scripts/fix-firebase-uids.ts

# 2) Apply the rebind once you've confirmed the mismatch.
APPLY=1 npx tsx scripts/fix-firebase-uids.ts
```

The script uses the Admin SDK (the service-account key already in `.env`) to resolve
each email's *current* Firebase UID, then updates only `Account.firebaseUid`. It
never touches `email`, `role`, `status`, or related rows.

## Environment files

| File | Committed? | Purpose |
|---|---|---|
| `apps/api/.env` | no (gitignored) | Real dev secrets. `DATABASE_URL` = Supabase dev DB. |
| `apps/api/.env.example` | yes | Documents the dev shape. |
| `apps/web/.env` | no (gitignored) | `VITE_API_BASE_URL=http://localhost:3000` + Firebase web config. |
| `apps/web/.env.development.local` | no (gitignored) | Dev override forcing the localhost API for `npm run dev`. |
| `apps/web/.env.example` | yes | Documents the shape. |

## Tests that guard this topology

- `apps/api/src/config-topology.test.ts` — asserts local web → localhost API,
  dev DB = Supabase (not prod), and (when `.env` is present) that the backend
  service-account project matches the web's `VITE_FIREBASE_PROJECT_ID` (single
  shared Firebase project). Run with `npm run test -w @mea/api`.
- **Test DB safety:** `apps/api/test/globalSetup.ts` provisions the test schema
  with `prisma db push --force-reset`, but ONLY against a localhost DB (from
  `TEST_DATABASE_URL`, defaulting to `localhost:5432/mea_test`). It ignores the
  repo's `DATABASE_URL` (Supabase) and refuses `db push` against any non-localhost
  URL, so the suite can never wipe the dev/prod database. The DB-touching tests
  require a local Postgres reachable at `TEST_DATABASE_URL`.
- `apps/api/src/routes/accounts.test.ts` — includes a regression test for the
  stale-`firebaseUid` flow: `403 "Account not found"` when the token UID ≠ stored
  UID, then `200` after the UID is rebound.
