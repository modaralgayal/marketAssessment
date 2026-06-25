# GCC Market Entry Self-Assessment

A web app for **Integrate Us Oy** that lets European food & beverage companies submit a
market-entry self-assessment (with their product catalogue), and lets an admin review all
submissions.

**MVP:** public form → stored submission + uploaded catalogue · admin signs in with Google and
reviews submissions. Built to scale toward customer accounts later.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript, Tailwind, React Router, TanStack Query, React Hook Form |
| Backend | Node + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Validation | Zod (shared front/back via `packages/shared`) |
| Admin auth | Firebase Authentication (Google) + email allowlist |
| File storage | Cloudflare R2 (S3-compatible), abstracted behind `StorageProvider` |
| Hosting | Render |

```
apps/web         # Vite React app (public form + admin dashboard)
apps/api         # Express + Prisma API
packages/shared  # Zod schemas + shared TS types (single source of truth)
```

## Local development

### 1. Prerequisites
- Node 20+ and npm 10+
- A PostgreSQL database (local Docker or a hosted dev DB)
- A Cloudflare R2 bucket + API token
- A Firebase project with **Google** sign-in enabled

Spin up Postgres locally with Docker if needed:
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
- **api/.env** — `DATABASE_URL`, `ADMIN_EMAILS` (your Google email), R2 keys, and
  `FIREBASE_SERVICE_ACCOUNT_B64` (base64 of the Firebase service-account JSON).
- **web/.env** — `VITE_API_BASE_URL` and the Firebase web config values.

### 4. Database
```bash
npm run db:migrate     # creates tables from prisma/schema.prisma
```

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
| `npm run db:migrate` | Apply / create Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run build` | Production build of the web app |
| `npm run typecheck -w @mea/api` / `-w @mea/web` | Type-check a workspace |

## Deployment (Render)

`render.yaml` defines three resources: Postgres, the API web service, and the web static site.
After connecting the repo as a Render Blueprint, set the `sync: false` env vars in the dashboard
(R2 keys, Firebase service account, `ADMIN_EMAILS`, and the cross-origin URLs `WEB_ORIGIN` /
`VITE_API_BASE_URL`). Also add your Render web URL to Firebase **Authentication → Settings →
Authorized domains**.

## Notes
- See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for the full design rationale and data model.
- File storage is abstracted in `apps/api/src/storage/` — swapping R2 for S3 or local disk is a
  one-file change.
- Adding customer accounts later is additive: a `users`/`companies` model + reusing the existing
  Firebase auth, no rewrite of the form or submission pipeline.
