# Tradelomacy — GCC Market-Entry Platform

A web app for **Integrate Us Oy** that helps European food & beverage / FMCG manufacturers
assess and pursue **GCC market entry** (Saudi Arabia, UAE and neighbouring Gulf states).

The flow: a manufacturer submits a public **self-assessment** (with their product catalogue),
an admin reviews and scores it against an assessment framework, auto-matches it to distributors,
extracts catalogue data, and can convert it into a customer. The same workspace supports
self-service **manufacturer / buyer accounts**, access requests, opportunity cards, conversations
and sourcing inquiries.

> This is the application repository. For project memory, conventions, the data model and the
> database/topology rules, read [`CLAUDE.md`](CLAUDE.md). Deployment details live in
> [`docs/deployment.md`](docs/deployment.md).

## Status

**In production** (hosted on Render). Accounts, matching, opportunity cards and the renewed
marketing site are live. It is no longer an MVP — it has grown into a full, multi-feature
platform (see Architecture).

## Architecture at a glance

The codebase is a **modular monolith** organised as an npm-workspace monorepo, with a **shared
Zod contract** as the anti-corruption layer between a **Backend-for-Frontend (BFF)** and a
single-page app. External integrations sit behind **ports & adapters (hexagonal)** boundaries,
and business logic is (being) pulled into a **service layer** so the Express routes stay thin.

| Concept | What it is here | Today |
|---|---|---|
| **Modular Monolith** | npm workspaces | `packages/shared`, `apps/api`, `apps/web` |
| **Shared Contract (ACL)** | `@mea/shared` Zod schemas + TS types | Single source of truth for the API; both api & web import it directly |
| **BFF** | `apps/api` (Express) | Already a BFF in front of the SPA |
| **Ports & Adapters** | External integrations | `StorageProvider` is a real port (R2 adapter); Auth/AI/Mail/Sheets are next to be formalised as ports |
| **Service Layer** | Business logic | Lives inline in `routes/*.ts` today; being extracted into `services/*` (see `CLAUDE.md`) |
| **Vertical Slices** | Frontend organisation | `apps/web/src/features/*` by domain; backend routes grouped by resource |

```
 web (SPA, features/*)  ──shared Zod contract──▶  api (BFF)
   components/ui            @mea/shared             routes/  (thin controllers)
   features/{domain}/         ▲ schemas             services/ (business logic — in progress)
                              │ types               repositories/ (Prisma wrappers)
                                                      ports/  → adapters/
                                                        auth(firebase) ai(anthropic)
                                                        storage(r2)     mail(smtp)
                                                                      sheets(google)
```

**Why this shape (and not microservices):** it is one deployable on Render (one Postgres, one
API, one static SPA). A distributed split would add network + ops cost with no current benefit,
while the hexagonal boundaries are already half-built (`StorageProvider`), so completing them is
cheap and makes the AI/Firebase/R2/Sheets integrations individually testable.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite 6 + React 18 + TypeScript, Tailwind, React Router, TanStack Query, React Hook Form |
| Backend | Node 20 + Express + TypeScript (`tsx watch` in dev) |
| Database | PostgreSQL + Prisma 6 |
| Validation | Zod (shared front/back via `packages/shared`) |
| Admin auth | Firebase Authentication (Google) + email allowlist (`ADMIN_EMAILS`) |
| Accounts auth | Firebase (Google **and** Email/Password) |
| File storage | Cloudflare R2 (S3-compatible), behind `StorageProvider` |
| AI | `@anthropic-ai/sdk`, model `claude-haiku-4-5-20251001` (`CLAUDE_API_KEY`) |
| Email | Nodemailer (`SMTP_*`, optional) |
| Sheets | Google Sheets sync via `googleapis` (`GOOGLE_SHEET_ID`, optional) |
| Hosting | Render (Postgres + `mea-api` web service + `mea-web` static site) |

## Repository structure

```
packages/shared   # Zod schemas + TS types (single source of truth, one file per domain)
apps/api          # Express BFF
  src/routes/     # resource routers (controllers: validate → guard → call service/logic → DTO)
  src/lib/        # claudeMatch, claudeScore, catalogueExtract, promptSafety, sheetsSync, mailer
  src/storage/    # StorageProvider port + R2 (S3-compatible) adapter
  prisma/         # schema.prisma + migrations
apps/web          # Vite SPA
  src/features/   # vertical slices (form, auth, admin, marketing, manufacturer, buyer, dashboard)
  src/components/ui  # shared UI atoms (incl. form-fields primitives)
  src/lib/api/    # per-domain API client modules (barrel: index.ts)
docs/             # deployment.md, deal-readiness-agent.md
```

## Local development

### 1. Prerequisites
- Node 20+ and npm 10+
- A **local** PostgreSQL (Docker) for dev, OR the shared dev DB (see Database topology)
- A Cloudflare R2 bucket + API token
- A Firebase project with Google sign-in (and Email/Password) enabled

```bash
docker run --name mea-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
Fill in both files:
- **api/.env** — `DATABASE_URL`, `ADMIN_EMAILS` (Google allowlist), R2 keys,
  `FIREBASE_SERVICE_ACCOUNT_B64`, `CLAUDE_API_KEY`. `SMTP_*` / `GOOGLE_SHEET_ID` are optional.
- **web/.env** — `VITE_API_BASE_URL` and the Firebase web config values.

### 4. Database — read this before running any `prisma migrate`
`DATABASE_URL` points at **Supabase** (a shared DB with real data). Treat it as production.
- `npm run db:migrate` = `prisma migrate dev`. This **resets the DB on schema drift**, so it must
  only ever run against a throwaway **local** Postgres. It is guarded and hard-fails on any
  non-localhost `DATABASE_URL`. **Do not** run it against Supabase.
- `npm run db:deploy` = `prisma migrate deploy`. Safe against **any** DB (no reset) — use this for
  Supabase and prod.

For a fresh local Postgres:
```bash
npm run db:migrate     # local only — creates/appplies migrations, resets on drift
```
For the shared/dev or prod DB, use `db:deploy` (never `db:migrate`).

### 5. Run
```bash
npm run dev            # starts API (:3000) and web (:5173) together
```
- Public form: http://localhost:5173/
- Admin: http://localhost:5173/admin (sign in with a Google account on the allowlist)

### Useful scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Run API + web concurrently |
| `npm run db:migrate` | **Local only** — author/apply Prisma migrations (guarded; resets on drift) |
| `npm run db:deploy` | Apply migrations to any DB incl. Supabase (safe, no reset) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate the Prisma client after a schema edit |
| `npm run build -w @mea/web` | Production web build |
| `npm run typecheck -w @mea/api` / `-w @mea/web` | Type-check a workspace |
| `npm run test -w @mea/api` / `-w @mea/web` | Run vitest (needs a local Postgres via `TEST_DATABASE_URL`) |

## Database topology

**Two databases, one schema.** Dev/local uses **Supabase** (`apps/api/.env` → `DATABASE_URL`,
holds dev data shown in `/admin` locally). Prod uses **Render Postgres** (set in the Render
dashboard for `mea-api`, not in `.env`). "Prod and dev have different data" is expected.

**Single Firebase project** (`market-entry-assessment`) for dev **and** prod — no separate
dev/prod Firebase project. The backend verifies ID tokens via the Admin SDK.

Accounts are keyed by `firebaseUid`, not email. If a previously-working Google sign-in starts
showing *"This Google account doesn't have a workspace"*, the stored `firebaseUid` no longer
matches — fix it non-destructively with `scripts/fix-firebase-uids.ts` (see `docs/deployment.md`).

## Deployment (Render)

`render.yaml` defines three resources: Postgres, the API web service (`mea-api`), and the web
static site (`mea-web`, serving `apps/web/dist`). After connecting the repo as a Render Blueprint,
set the `sync: false` env vars in the dashboard (R2 keys, Firebase service account, `ADMIN_EMAILS`,
`CLAUDE_API_KEY`, and the cross-origin URLs `WEB_ORIGIN` / `VITE_API_BASE_URL`). Also add your
Render web URL to Firebase **Authentication → Settings → Authorized domains**.

The API `preDeployCommand` runs `db:deploy` (never `db:migrate`). Full details in
[`docs/deployment.md`](docs/deployment.md).

## Contributing / conventions

- **Edit `@mea/shared` first.** Both `api` and `web` import it directly, so a schema/type change
  must be reflected in both packages.
- **Wrap untrusted Claude input.** Any submitted form field or uploaded file text must go through
  `wrapUntrusted` + `UNTRUSTED_DATA_GUARDRAIL` in `apps/api/src/lib/promptSafety.ts`.
- **Always `jsonrepair` Claude JSON output.** Haiku responses frequently contain unescaped quotes /
  trailing commas; use `jsonrepair`, don't hand-roll cleanup.
- **Migrations:** against Supabase/prod, always `db:deploy` — never `db:migrate`.
- Keep the **shared form-field primitives** in `apps/web/src/components/ui/form-fields.tsx`; do
  not re-declare `Field`/`TextField`/`SelectField`/`CheckboxGroup`/`RadioGroup`/`Panel` per feature.
- The marketing site's CSS/content are **generated** from the source Tradelomacy website via the
  `_scope.py` / `_extract.py` scripts — don't hand-edit the generated files.

## Notes

- See [`CLAUDE.md`](CLAUDE.md) for the full project memory, data model and the assessment/matching
  domain. See [`docs/`](docs) for deployment and the deal-readiness agent.
- File storage is abstracted in `apps/api/src/storage/` — swapping R2 for S3 or local disk is a
  one-file change (the `StorageProvider` port).
- New product features are additive: new accounts/logins and email workflows reuse the existing
  Firebase auth and Prisma models rather than rewriting the form or submission pipeline.
