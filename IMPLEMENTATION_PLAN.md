# GCC Market Entry Self-Assessment — Implementation Plan

**Client:** Integrate Us Oy
**Date:** 2026-05-31

---

## 1. Scope

### MVP (this build)
- **Public form** — anonymous, no login. Matches the design in `GCC_Market_Entry_Self_Assessment_Form.html`. Includes a **required catalogue / price-list file upload**.
- **Admin dashboard** — single admin signs in with **Google (Firebase)**, views a list of all submissions, opens a detail view, and downloads the attached catalogue.

### Explicitly out of scope (designed for, not built)
- Customer accounts / self-service product editing
- Assessment scoring workflow, email notifications
- Multiple admins / roles beyond a single allowlist

The data model and auth are structured so these are **additive**, not rewrites.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript, Tailwind CSS + shadcn/ui, React Router, TanStack Query, React Hook Form |
| Backend | Node + TypeScript + Express |
| Database | PostgreSQL + Prisma |
| Validation | Zod (shared via `packages/shared`) |
| Admin auth | Firebase Authentication (Google sign-in) + admin email allowlist |
| File storage | Cloudflare R2 (S3-compatible), behind a `StorageProvider` interface |
| Hosting | Render (static site + web service + Postgres) |

---

## 3. Repository structure

```
market-entry-assessment/
├─ package.json                  # root, npm workspaces + scripts
├─ tsconfig.base.json
├─ .gitignore                    # node_modules, dist, .env*, uploads/
├─ apps/
│  ├─ web/                       # Vite + React
│  │  ├─ src/
│  │  │  ├─ main.tsx
│  │  │  ├─ App.tsx              # router
│  │  │  ├─ lib/                 # api client, firebase init, query client
│  │  │  ├─ components/ui/       # shadcn primitives
│  │  │  ├─ features/form/       # public form (one component per section)
│  │  │  └─ features/admin/      # login, list, detail
│  │  ├─ index.html
│  │  ├─ tailwind.config.ts
│  │  └─ vite.config.ts
│  └─ api/                       # Express + Prisma
│     ├─ src/
│     │  ├─ index.ts             # express bootstrap
│     │  ├─ env.ts               # zod-validated env
│     │  ├─ prisma.ts            # PrismaClient singleton
│     │  ├─ routes/
│     │  │  ├─ submissions.ts    # public POST + admin GET
│     │  │  └─ files.ts          # admin download (signed url)
│     │  ├─ middleware/
│     │  │  ├─ requireAdmin.ts   # verify firebase token + allowlist
│     │  │  └─ errorHandler.ts
│     │  ├─ storage/
│     │  │  ├─ index.ts          # StorageProvider interface
│     │  │  └─ r2.ts             # R2 implementation
│     │  └─ lib/firebaseAdmin.ts
│     └─ prisma/
│        ├─ schema.prisma
│        └─ migrations/
└─ packages/
   └─ shared/                    # Zod schemas + inferred TS types
      └─ src/submission.ts
```

Tooling: **npm workspaces** (simplest, no extra tool). Scripts at root: `dev`, `build`, `db:migrate`, `db:studio`.

---

## 4. Data model (Prisma)

```prisma
// enums mirror the form's fixed options
enum RevenueBracket { UNDER_1M; R1_5M; R5_20M; R20_50M; R50_100M; OVER_100M }
enum YesNoUnsure    { YES; IN_PROGRESS; NO; UNSURE }
enum Timeline       { ASAP; WITHIN_6M; WITHIN_12M; OVER_12M }
enum Capacity       { YES; PARTIAL; NO }
enum Adaptability   { YES; PARTIAL; NO }
enum BudgetBracket  { NONE; UNDER_10K; B10_30K; B30_60K; OVER_60K }
enum Horizon        { LONG_TERM; TRANSACTIONAL }
enum Activation     { YES; DISCUSS; NO }
enum SfdaStatus     { REGISTERED; IN_PROCESS; NOT_YET; UNSURE }

model Submission {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  // Section 1 — Company Profile
  companyName          String
  country              String
  website              String?
  industryCategory     String
  annualRevenue        RevenueBracket?
  yearsInBusiness      String?
  currentExportMarkets String?

  // Section 2 — Product
  productNames     String
  numberOfSkus     String?
  shelfLife        String?
  exWorksPriceRange String?
  halalCert        YesNoUnsure?
  otherCerts       String[]        // organic, nongmo, kosher, vegan, glutenfree, other, none
  labelLanguages   String?

  // Section 3 — GCC Ambitions
  targetMarkets        String[]    // ksa, uae, both, gcc, unsure
  salesChannels        String[]
  timeline             Timeline?
  revenueYear1Target   String?
  revenueYear3Target   String?
  gccContact           Boolean?
  gccContactDetails    String?
  distributionPartner  Boolean?
  distributionDetails  String?

  // Section 4 — Operational Readiness
  moq               String?
  exportContact     Boolean?
  productionCapacity Capacity?
  sfdaStatus        SfdaStatus?

  // Section 5 — Flexibility & Commitment
  productAdaptability Adaptability?
  budget              BudgetBracket?
  partnershipHorizon  Horizon?
  brandActivation     Activation?

  // Section 6 — Decision-Maker Contact
  contactFullName        String
  contactTitle           String?
  contactEmail           String
  contactPhone           String?
  hasSigningAuthority    Boolean?
  signingAuthorityContact String?
  anythingElse           String?

  files SubmissionFile[]

  @@index([createdAt])
  @@index([contactEmail])
}

model SubmissionFile {
  id           String   @id @default(cuid())
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  storageKey   String   // R2 object key
  originalName String
  contentType  String
  sizeBytes    Int
  createdAt    DateTime @default(now())
}
```

**Why explicit columns (not one big JSON blob):** the admin will want to scan/filter submissions, and explicit columns + enums give type safety and queryability. Multi-select fields use Postgres `String[]`. Most fields are nullable so a partially-filled form still saves — only a few are required (see §5).

**Future extension (not migrated now):** add `User { id, firebaseUid, email, role }`, `Company`, `Product`, and a nullable `Submission.companyId`. Purely additive.

---

## 5. Shared validation (`packages/shared`)

A single Zod schema is the source of truth, imported by both the React form and the Express route.

- **Required for MVP:** `companyName`, `country`, `industryCategory`, `productNames`, `contactFullName`, `contactEmail` (valid email), **at least one uploaded file**.
- Everything else optional.
- Enum fields validated against fixed option lists; multi-selects are arrays of allowed string literals.
- Export inferred type: `export type SubmissionInput = z.infer<typeof submissionSchema>`.

The file itself is validated server-side (type ∈ {pdf, xls, xlsx, csv, doc, docx}, size ≤ ~15 MB) since files don't go through Zod JSON parsing.

---

## 6. Backend API (Express)

### Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/submissions` | public | Create submission + upload file(s). `multipart/form-data` via **multer** (memory storage) → stream to R2 → write rows in a Prisma transaction. |
| `GET` | `/api/submissions` | admin | List submissions (newest first; basic pagination params). |
| `GET` | `/api/submissions/:id` | admin | Full submission + file metadata. |
| `GET` | `/api/files/:id/download` | admin | Returns a short-lived **R2 signed URL** (presigned GET), or streams the file. |
| `GET` | `/api/health` | public | Render health check. |

### Storage abstraction
```ts
interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  getSignedUrl(key: string, expiresInSec: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```
`r2.ts` implements it with `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` pointed at the R2 endpoint. Swapping to S3/local later = new file implementing the same interface.

### Cross-cutting
- **CORS** restricted to the web origin.
- **Rate limiting** on `POST /api/submissions` (`express-rate-limit`) to deter spam on the public endpoint.
- Central **error handler**; Zod errors → 400 with field messages.
- Env validated at boot via `env.ts` (Zod) — fail fast if misconfigured.

---

## 7. Admin authentication (Firebase + allowlist)

**Flow**
1. Web app initializes Firebase with public web config; admin clicks "Sign in with Google" → `signInWithPopup` → Firebase ID token.
2. TanStack Query / fetch attaches `Authorization: Bearer <idToken>` to admin requests.
3. `requireAdmin` middleware verifies the token with the **Firebase Admin SDK** (`verifyIdToken`) and checks `decoded.email` ∈ `ADMIN_EMAILS`. Pass → attach `req.admin`; fail → 401/403.

**Notes**
- Public form endpoint is unauthenticated by design.
- Adding customers later: same Firebase project; they authenticate the same way but are simply *not* on the admin allowlist, and get customer-scoped routes.
- Backend needs a Firebase **service-account** credential (JSON), provided via env (base64) on Render.

---

## 8. Frontend (Vite + React)

### Routes (React Router)
- `/` — public self-assessment form
- `/admin/login` — Google sign-in
- `/admin` — submissions list (protected)
- `/admin/submissions/:id` — detail + file download (protected)
- `ProtectedRoute` wrapper redirects to login if no Firebase session.

### Public form
- Rebuild the HTML design as React components — **one component per section** (1–6), styled with Tailwind to match the existing palette (`--dark-blue #1B3A5C`, `--orange #E8A020`, etc.). Reuse the cover header, promise row, intro box, section headers, "chip" radio/checkbox styling.
- **React Hook Form + Zod resolver** (shared schema) for state + validation.
- File input for the required catalogue/price-list with client-side type/size hints.
- Submit → `multipart/form-data` POST → success screen ("We'll respond within 5 business days").

### Admin dashboard
- **List:** table — company, country, contact, date, file count; newest first; search by company/email.
- **Detail:** all sections laid out read-only; download button per file.
- TanStack Query for fetching/caching; auth header injected centrally.

---

## 9. Environment variables

**`apps/api/.env`**
```
DATABASE_URL=postgresql://...
WEB_ORIGIN=http://localhost:5173
ADMIN_EMAILS=you@gmail.com
FIREBASE_SERVICE_ACCOUNT_B64=...        # base64 of service-account JSON
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=market-entry-catalogues
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
```
**`apps/web/.env`**
```
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```
`.env.example` files committed; real `.env` gitignored.

---

## 10. Local development
1. `npm install` at root (workspaces).
2. Postgres locally (Docker `postgres:16` or a Render dev DB).
3. `npm run db:migrate` (Prisma migrate dev).
4. `npm run dev` → runs API (`:3000`) and web (`:5173`) concurrently.
5. Seed nothing for MVP; admin access = being on `ADMIN_EMAILS`.

---

## 11. Render deployment
- **Postgres:** Render managed Postgres → `DATABASE_URL`.
- **API:** Web Service (Node). Build: `npm install && npm run build -w api && npx prisma migrate deploy`. Start: `node apps/api/dist/index.js`. Env vars from §9. Health check `/api/health`. *(No persistent disk needed — files live in R2.)*
- **Web:** Static Site. Build: `npm install && npm run build -w web`. Publish `apps/web/dist`. SPA rewrite `/* → /index.html`. Set `VITE_*` build env vars.
- `render.yaml` (blueprint) checked in to define all three.
- CORS `WEB_ORIGIN` = the static site URL.

---

## 12. Build order (milestones)
1. **Scaffold** — monorepo, workspaces, TS config, Tailwind, Prisma, DB connection, health route.
2. **Schema & shared types** — Prisma schema + first migration; Zod schema in `packages/shared`.
3. **Public submission API** — `POST /api/submissions` + multer + R2 storage layer; validation; rate limit.
4. **Public form UI** — all 6 sections matching the design; RHF + Zod; file upload; success screen.
5. **Admin auth** — Firebase web sign-in + `requireAdmin` middleware.
6. **Admin dashboard** — list + detail + signed-URL download.
7. **Deploy** — `render.yaml`, env wiring, smoke test end-to-end.

Each milestone is independently runnable/testable.

---

## 13. Prerequisites to gather (can stub initially)
- Cloudflare R2: account ID, bucket, access key + secret, endpoint.
- Firebase: project with Google sign-in enabled; web config + service-account JSON.
- Admin Google email(s).
