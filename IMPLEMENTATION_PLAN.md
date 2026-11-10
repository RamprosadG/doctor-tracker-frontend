# Implementation Plan: Doctor Tracker

Full-stack administrative portal for managing doctors and their patients.
Two repositories are built **in parallel, one step at a time**: every step below
finishes the backend slice *and* the frontend slice for the same feature, then
verifies, then commits. No step moves to the next until its `Verify:` command passes.

- Backend: `doctor-tracker-backend/` — Node.js + Express 5 + Mongoose + MongoDB (TypeScript, ESM)
- Frontend: `doctor-tracker-frontend/` — Next.js App Router + Tailwind v4 + Recharts (TypeScript)

**Status legend:** `Planned` → `In Progress` → `Verifying` → `Verified & Committed`

**Documentation rule:** no file in either repository — code comment, README, commit message or
this plan — may name another project. Every component is described as something built here.

## 📊 Overall Progress Summary

- [x] **Step 0: Dual Bootstrap — Repo Skeletons, Config, Shell & UI Primitives** *(Verified & Committed)*
- [x] **Step 1: Data Layer — Mongoose Models, Indexes, Seed & Typed API Client** *(Verified & Committed)*
- [x] **Step 2: Authentication — Login, Token Rotation, Protected Routes** *(Verified & Committed)*
- [ ] **Step 3: Doctor Management — CRUD, Search, Filter, Pagination** *(Planned)*
- [ ] **Step 4: Patient Management — Dedicated Page, CRUD, Filters** *(Planned)*
- [ ] **Step 5: Doctor ↔ Patient Relations — Detail View & Sub-lists** *(Planned)*
- [ ] **Step 6: Dashboard & Analytics — Recharts Visual Insights** *(Planned)*
- [ ] **Step 7: Performance, Hardening & End-to-End QA** *(Planned)*
- [ ] **Step 8: Documentation, Visual Evidence & Release** *(Planned)*

### Track record

| Step | Scope | Backend commit | Frontend commit | Status |
| ---- | ----- | -------------- | --------------- | ------ |
| 0 | Bootstrap | `21c6760` | `301bae0` | Verified & Committed |
| 1 | Data layer | `fe732a2` | `ec63f0d` | Verified & Committed |
| 2 | Auth | — | — | Planned |
| 3 | Doctors | — | — | Planned |
| 4 | Patients | — | — | Planned |
| 5 | Relations | — | — | Planned |
| 6 | Dashboard | — | — | Planned |
| 7 | Performance/QA | — | — | Planned |
| 8 | Docs/Release | — | — | Planned |

Fill the two commit columns with the short SHA once the step is verified.

---

## Architecture Decisions (locked before code)

These are fixed by the requirement document and by the conventions already used in
these two stacks. Later steps must not re-litigate them.

1. **Separate services, REST between them.** Express owns the database; Next.js owns
   rendering. List pages are Server Components that call the API, mutations are client
   fetches. No database driver inside the Next.js app.
2. **httpOnly cookie auth with refresh rotation.** `accessToken` (30 min) and
   `refreshToken` (7 days) are httpOnly `SameSite=Lax` cookies. Only the SHA-256 hash of
   the refresh token is stored in MongoDB; reuse of a rotated token revokes the family.
   Cookies ignore ports, so `localhost:3000` ↔ `localhost:5000` shares them in dev;
   production flips to `SameSite=None; Secure`.
3. **Seeded admin, no public signup.** The portal is administrative. `npm run seed`
   creates the single admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. **RESTful, resource-shaped routes** (`GET/POST /doctors`, `GET/PATCH/DELETE /doctors/:id`,
   nested `GET/POST /doctors/:id/patients`) because the spec explicitly asks for REST design.
5. **Database-side filtering, pagination and aggregation.** Every list endpoint builds one
   `$match` filter, runs `countDocuments` + `skip`/`take` with a projection, and never
   post-filters a full collection in JavaScript.
6. **KPI cards read a separate, deliberately unfiltered endpoint** from the table they sit above.
7. **Case-insensitive search uses lowercase mirror fields + anchored regex** (`nameLower`,
   `conditionLower`) so the predicate stays an `IXSCAN`; `/i` regex and `$text` are rejected
   because the first cannot use an index and the second cannot match partial words.
8. **Secrets live only in `.env`**, which is git-ignored; `.env.example` documents every key.
9. **TypeScript end to end.** Both repositories are strict-mode TypeScript with no JavaScript
   source files: the API uses `NodeNext` ESM compiled by `tsc` (run in development through
   `tsx`), and every `.tsx` component, context, hook and API client in the Next.js app is
   typed against the same DTOs the API returns.

---

## 🛠️ Detailed Step Breakdown

### Step 0: Dual Bootstrap — Repo Skeletons, Config, Shell & UI Primitives
**Goal**: Both repositories install, lint, typecheck and run with an empty but correctly
shaped architecture. No feature logic and no database dependency in this step.
**Status:** Verified & Committed

#### Backend
- [x] **0.1** `package.json` (`"type": "module"`, scripts `dev`/`build`/`start`/`lint`/`typecheck`/`seed`), `tsconfig.json` (NodeNext, strict, `outDir: dist`), `.gitignore` (`node_modules`, `.env`, `dist`), ESLint flat config.
  - Verify: `node -e "console.log(require('./package.json').type)"` prints `module`.
- [x] **0.2** `.env` + `.env.example` with `NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_CA_FILE`, `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL`, `ALLOWED_ORIGINS`, `RATE_LIMIT_*`. `.env` holds real local values and is never committed.
  - Verify: `git check-ignore -v .env` reports a match; `git ls-files .env.example` lists the file.
- [x] **0.3** `src/configs/config.ts` — one typed env reader that fails fast on a missing key in production.
  - Verify: `npm run typecheck`.
- [x] **0.4** `src/app.ts` (cookie-parser, json, urlencoded, CORS allow-list with credentials, `GET /health`, 404 handler) + `src/server.ts` (boots later steps; in this step it listens without a DB) + `src/middlewares/globalError.ts` (`{ success:false, message }` envelope, stack only in dev).
  - Verify: `curl http://localhost:5000/health` → `{ "success": true, ... }`; unknown path → 404 envelope.
- [x] **0.5** Folder skeleton; `src/modules/<domain>/` and `src/types/` stay empty until their
  first real file lands in Steps 1–2. Already present: `src/middlewares/`, `src/utils/`, `src/routes/`, `src/configs/`.
  - Verify: `npm run lint && npm run typecheck && npm run build`.

#### Frontend
- [x] **0.6** Next.js 16 App Router scaffold inside `src/`: `package.json`, `tsconfig.json` (`@/*` alias, strict), `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `.env` + `.env.example` (`NEXT_PUBLIC_API_URL`, `API_SERVER_URL`).
  - Verify: `npx tsc --noEmit` clean.
- [x] **0.7** `src/app/globals.css` (Tailwind v4 import, theme vars, `--app-nav-height`, scrollbars) and `src/app/layout.tsx` (Geist fonts, metadata, shell + `AuthProvider` wrapper slot).
  - Verify: `npm run dev` serves `/` with a 200 and the shell markup.
- [x] **0.8** Shared chrome in `src/components/shared/`: `AppLayoutShell` (fixed `w-72` desktop rail, `lg:pl-72` content, fixed header, footer), `Sidebar` (Dashboard / Doctors / Patients, active state, mobile drawer + backdrop), `Navbar`, `Footer`, `PageHeader` (the one title/description/actions block every page opens with). The session controls (`UserMenu`) arrive with Step 2.
  - Verify: three nav links resolve; drawer opens/closes at 375 px.
- [x] **0.9** UI primitives in `src/components/ui/`: `buttons/Button`, `buttons/TableActionButton`, `inputs/Input`, `inputs/Textarea`, `inputs/SearchInput`, `dropdowns/Dropdown`, `filters/FilterBar`, `tables/DataTable` (loading, empty, striped rows, `renderCard` mobile face, expandable row), `pagination/Pagination`, `modals/Modal`, `modals/ConfirmModal`, `alerts/Alerts`, `badges/Badge`, `stats/StatCard`.
  - Verify: `npm run lint && npm run build` clean.
- [x] **0.10** Route shells `/`, `/doctors`, `/patients` (+ `/login` in Step 2) with header-only placeholder content, `not-found.tsx`, and `src/lib/utils.ts` + `src/types/pagination.ts` (the shared `PaginationMeta` contract).
  - Verify: `npm run build` prerenders all four routes.
- [x] **0.11** Copy this plan into both repos and add `scripts/plan-status.mjs` (parses the checkboxes, prints per-step progress + next open item, `--json`).
  - Verify: `node scripts/plan-status.mjs` prints 0 % with Step 0 as next.

**Step 0 gate:** `npm run build` in both repos, `npm run lint` + `npm run typecheck` in both, health endpoint green. → commit both repos, record SHAs.

---

### Step 1: Data Layer — Mongoose Models, Indexes, Seed & Typed API Client
**Goal**: One real MongoDB connection, validated schemas, deliberate indexes, and a typed
contract both sides compile against.
**⚠ Needed `MONGODB_URI` in `doctor-tracker-backend/.env` — supplied and verified against a live
TLS-protected hosted cluster on 2026-11-10.**
**Status:** Verified & Committed

#### Backend
- [x] **1.1** `src/configs/db.ts` — Mongoose connect with `autoIndex` off in production, retry/backoff, CA file support for a TLS-enforced hosted cluster, graceful disconnect.
  - Verify: `npm run dev` logs a single "MongoDB connected" line for the actual host. Proven again
    by `npm run db:inspect`, the read-only probe added with this step (counts, index list, plans).
- [x] **1.2** `src/modules/user/user.model.ts` — `name`, unique lower-cased `email`, `password` (`select: false`), `role` enum `['admin']`, timestamps.
  - Verify: `db.users.getIndexes()` in a probe script.
- [x] **1.3** `src/modules/doctor/doctor.model.ts` — `name`, `specialization`, `hospital`, `phone`, `email` (unique), lowercase mirrors, timestamps. Indexes: `{ email: 1 }` unique, `{ phone: 1 }` unique, `{ nameLower: 1 }`, `{ specializationLower: 1 }`, `{ hospitalLower: 1 }`, `{ specialization: 1, createdAt: -1 }`, `{ createdAt: -1 }`.
  - Verify: index list matches, duplicate email rejected with code 11000.
- [x] **1.4** `src/modules/patient/patient.model.ts` — `name`, `phone`, `email`, `gender`, `age`, `condition`, `notes`, `visitDate`, `doctorId` (ref, required), lowercase mirrors. Indexes: `{ doctorId: 1, visitDate: -1 }`, `{ condition: 1, visitDate: -1 }`, `{ visitDate: -1 }`, `{ nameLower: 1 }`, `{ phone: 1 }` unique, `{ emailLower: 1 }`.
  - Verify: `explain()` on a `doctorId` match shows `IXSCAN`; deleting a doctor leaves no orphan patients (documented policy).
- [x] **1.5** `src/scripts/seed.ts` — idempotent: upserts the admin, clears and refills sample doctors/patients with deterministic dates spread over ~90 days so charts and date filters have data.
  - Verify: `npm run seed` twice → identical counts; counts printed.
- [x] **1.6** Shared response envelope helpers in `src/utils/apiHelpers.ts`: `parsePagination`, `parseDateRange`, `escapeRegex`, `formatPaginatedResponse`, `sendSuccess/sendError`.
  - Verify: `npm run typecheck`.

#### Frontend
- [x] **1.7** `src/types/{auth,doctor,patient,dashboard,api}.ts` mirroring the API DTOs, one source of truth for labels/filter option lists and badge variants.
  - Verify: `npx tsc --noEmit`.
- [x] **1.8** `src/lib/api-client.ts` — browser fetch wrapper (`credentials: 'include'`, JSON, `cache: 'no-store'`, typed `ApiEnvelope<T>` unwrap, `ApiError` with status + field errors). The readiness probe it needs is served at both `GET /health` (external monitors) and `GET /api/v1/health` (the base URL the web app is configured against).
  - Verify: a throwaway page fetches `/health` through it and renders `ok` — on the server through
    `lib/server-api.ts` and in the browser through `apiClient`, plus a 404 path that proves the
    envelope message and status reach the caller.
- [x] **1.9** `src/lib/server-api.ts` — server-side fetch that forwards the incoming `cookie` header to `API_SERVER_URL` and exposes `apiGet/apiSend` for Server Components.
  - Verify: `npm run build`.

**Step 1 gate:** seed + index probes green against the real cluster, both repos typecheck/lint/build. → commit both.

---

### Step 2: Authentication — Login, Token Rotation, Protected Routes
**Goal**: One authenticated session path, closed by default, working end to end.
**Status:** Verified & Committed

#### Backend
- [x] **2.1** `src/utils/password.ts` (bcrypt hash/compare) + `src/utils/token.ts` (HS512 sign/verify, `hashToken`).
  - Verify: unit probe hashes/compares and round-trips a JWT payload.
- [x] **2.2** `refreshToken.model.ts` + `refreshToken.service.ts` — store hash + `tokenFamily`, create/rotate/revoke/find, reuse detection revokes the family, TTL index on `expiresAt`.
  - Verify: reuse of a rotated token returns 401 and clears that user's sessions.
- [x] **2.3** `auth.schema.ts` + `auth.controller.ts` + `auth.route.ts` — `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`; identical 401 wording for unknown email vs wrong password.
  - Verify: curl with a cookie jar shows both cookies set, `/auth/me` 200s after refresh, 401 without.
- [x] **2.4** `authenticate` middleware (access token → silent refresh from cookie) and `authorize(['admin'])`; `router.ts` mounts `/auth` publicly and everything else behind them.
  - Verify: an expired `accessToken` with a valid `refreshToken` still returns 200; a tampered token returns 401.
- [x] **2.5** Login rate limiting (`express-rate-limit`, keyed by IP) + cookie options from config.
  - Verify: 6th bad attempt in a minute returns 429.

#### Frontend
- [x] **2.6** `src/components/features/auth/AuthProvider.tsx` + `auth-client.ts` — `user`, `login`, `logout`, `refreshSession`, `bootstrap /auth/me`, loading state, single-flight refresh.
  - Verify: reload keeps the session; two parallel 401s trigger exactly one refresh.
- [x] **2.7** `/login` page (`LoginForm`, `LoginHeader`) with zod-shaped field errors, show/hide password, redirect to `?next=` target, and a SweetAlert on success.
  - Verify: wrong password → inline error; right password → lands on Dashboard.
- [x] **2.8** `src/proxy.ts` — cookie-presence gate: no `accessToken`/`refreshToken` on a protected path redirects to `/login?next=…`, and a signed-in visitor is pushed off `/login`.
  - Delivered as `proxy.ts`, not `middleware.ts`: Next 16 renamed the route-level proxy and still
    honors `middleware.ts` only with a deprecation warning. It also injects `x-request-path` so the
    server-side guard can rebuild `?next=`.
  - Verify: `curl -i` on `/doctors` without cookies returns 307 to `/login`.
- [x] **2.9** `UserMenu` wired to `useAuth` (initial avatar, email, logout → `/login`), sidebar hidden until authenticated, global 401 → session clear + redirect.
  - Verify: logout from each page returns to `/login` and blocks the back-route data.
- [x] **2.10** Server-side guard `requireUser()` in `src/lib/session.ts` used by every data page (401 → `redirect('/login')`).
  - `src/lib/server-api.ts` now forwards the `accessToken` cookie **only**. A rotation spent during a
    server render cannot be written back to the browser (Next permits cookie writes in Server Actions
    and route handlers, not in `after()` during a page render), so the browser is the single rotation
    authority. `(app)/layout.tsx` sets `export const instant = false` to keep the guard out of prerender.
  - Verify: direct hit on `/doctors` while signed out never renders table chrome.

**Step 2 gate:** login/logout/refresh matrix in the browser + curl, `npm run build` both. → commit both.

---

### Step 3: Doctor Management — CRUD, Search, Filter, Pagination
**Goal**: The full doctors list, driven by the database, on both screen faces.
**Status:** Planned

#### Backend
- [ ] **3.1** `doctor.schema.ts` — create/update/pagination-query/list-query zod schemas (email, phone format, min lengths, `limit` cap, ISO date bounds, sort whitelist).
  - Verify: an invalid `page` returns 400 with the field message.
- [ ] **3.2** `doctor.service.ts` list pipeline: single `$match` from search + specialization + hospital + date range, `countDocuments` → `skip`/`take` → projection with `lean()`, sorted by a whitelisted key.
  - Verify: `explain()` shows `IXSCAN`/bounded `docsExamined` at 5 000 seeded rows; page 2 returns different ids.
- [ ] **3.3** `doctor.controller.ts` + `doctor.route.ts` — `GET /doctors`, `POST /doctors`, `GET /doctors/:id`, `PATCH /doctors/:id`, `DELETE /doctors/:id`, `GET /doctors/meta/filters` (distinct specializations + hospitals for the dropdowns).
  - Verify: each verb through curl, duplicate email → 409, unknown id → 404 (not 500).
- [ ] **3.4** Delete semantics: removing a doctor removes or unassigns its patients inside one transaction (or ordered fallback), and the response reports the affected count.
  - Verify: patient count drops by exactly the deleted doctor's roster.

#### Frontend
- [ ] **3.5** `/doctors/page.tsx` Server Component + `Suspense` + `DoctorsContent` that reads URL search params, calls `GET /doctors`, and hands the payload to `DoctorsView`.
  - Verify: view-source contains row data; loading skeleton appears on slow navigation.
- [ ] **3.6** Shared `PageHeader` with `DoctorsActions` (create button) and `DoctorsSection` (state in URL, transition-guarded navigation, `router.refresh()` after mutations).
  - Verify: back/forward restores search + page; typing does not fire duplicate requests.
- [ ] **3.7** `DoctorsFilters` — `SearchInput` (debounced, name/specialization/hospital) + specialization + hospital + date-from + date-to dropdowns in `FilterBar`, with a Reset control when any filter is active.
  - Verify: each filter changes the server `page=1` request; reset clears all params.
- [ ] **3.8** `DoctorsTable` over `DataTable` — name (semibold, capped width), specialization + hospital as quiet text lines, phone, email, created date, patient count link, actions; `renderCard` mirrors the same field order at 375 px.
  - Verify: no horizontal scroll at 375 px; only one badge per row.
- [ ] **3.9** `DoctorFormModal` — create/update with client validation, server error mapping, "Create New"/"Save Changes" labels, `Button` variants reused from the shared primitive; delete through `confirmDelete`.
  - Verify: create → row appears; update → values persist; delete → row and its patients gone.
- [ ] **3.10** `Pagination` bound to the API `{ page, pageSize, total, totalPages }` meta.
  - Verify: "Showing x to y of z" matches the server `total`.

**Step 3 gate:** CRUD + every filter verified in the browser at desktop and phone widths, curl contract checks, lint/typecheck/build. → commit both.

---

### Step 4: Patient Management — Dedicated Page, CRUD, Filters
**Goal**: The standalone patients page the spec asks for, with condition and date filtering.
**Status:** Planned

#### Backend
- [ ] **4.1** `patient.schema.ts` — create/update/list-query schemas including `condition`, `doctorId` (valid ObjectId), gender enum, age bounds, `visitDate`, date range, sort whitelist.
  - Verify: a malformed `doctorId` returns 400 before touching Mongo.
- [ ] **4.2** `patient.service.ts` — same `$match` → count → `skip`/`take` shape, plus `$lookup` (or `$in` batch) so each row carries `doctorName`/`doctorSpecialization` without N+1 queries.
  - Verify: one list request issues a bounded number of queries; a patient whose doctor was deleted still renders with "Unassigned".
- [ ] **4.3** `patient.controller.ts` + `patient.route.ts` — `GET /patients`, `POST /patients`, `GET /patients/:id`, `PATCH /patients/:id`, `DELETE /patients/:id`, `GET /patients/meta/filters` (distinct conditions).
  - Verify: create with a non-existent doctor id → 404/400, edit reassigns the doctor, delete removes only that row.
- [ ] **4.4** Duplicate-phone guard and `visitDate` default to now when omitted.
  - Verify: second insert with the same phone → 409.

#### Frontend
- [ ] **4.5** `/patients/page.tsx` + `PatientsContent` + `PatientsView` mirroring the doctors page.
  - Verify: deep link `/patients?search=…&condition=…&page=2` renders exactly those rows.
- [ ] **4.6** `PatientsFilters` — search (name/phone/email), condition dropdown, doctor dropdown, date range, reset.
  - Verify: condition list comes from the API, not hardcoded.
- [ ] **4.7** `PatientsTable` + mobile card — name, contact, condition (single badge), assigned doctor, visit date, actions (edit/delete/view doctor link).
  - Verify: field order identical on both faces.
- [ ] **4.8** `PatientFormModal` — includes a searchable doctor select; create and update flows, confirm-delete.
  - Verify: creating under doctor A then editing to doctor B changes the count shown on both pages.

**Step 4 gate:** full patients CRUD + filter matrix verified, build clean. → commit both.

---

### Step 5: Doctor ↔ Patient Relations — Detail View & Sub-lists
**Goal**: The spec's "view corresponding patients for each doctor / add / delete" flows.
**Status:** Planned

#### Backend
- [ ] **5.1** `GET /doctors/:id` returning the doctor + `patientCount` via `$lookup`/`$count` (never a full roster load).
  - Verify: response has no patients array; count matches `countDocuments({ doctorId })`.
- [ ] **5.2** `GET /doctors/:doctorId/patients` — paginated + searchable + date-filtered sub-list scoped to the doctor, 404 when the doctor is missing.
  - Verify: page 2 stays within the doctor's roster; another doctor's patient never appears.
- [ ] **5.3** `POST /doctors/:doctorId/patients` — body `doctorId` is taken from the path, not the client, so a patient cannot be attached to the wrong doctor.
  - Verify: a conflicting body `doctorId` cannot override the path value.
- [ ] **5.4** `DELETE /doctors/:doctorId/patients/:patientId` — removes the link only when both ids match.
  - Verify: mismatched pair returns 404 and changes nothing.

#### Frontend
- [ ] **5.5** `/doctors/[id]/page.tsx` — doctor profile header (name, specialization, hospital, phone, email, joined date, patient count) with quiet caption/label styling.
  - Verify: invalid id renders `not-found`, not an error boundary.
- [ ] **5.6** `DoctorPatientsSection` — paginated/searchable patient table scoped to the doctor, "Add Patient" prefilled with that doctor, "Remove from list" confirm.
  - Verify: add and remove change the doctor's count and the main patients page consistently.
- [ ] **5.7** Cross-links: doctors table → detail, patient row → its doctor, breadcrumb back to `/doctors`.
  - Verify: every navigation round-trip preserves scroll-free loading state.

**Step 5 gate:** relation matrix verified against seeded data. → commit both.

---

### Step 6: Dashboard & Analytics — Recharts Visual Insights
**Goal**: Meaningful aggregation with real database pipelines, rendered as charts.
**Status:** Planned

#### Backend
- [ ] **6.1** `dashboard.service.ts` — `getSummaryDB()`: total doctors, total patients, average patients per doctor, new this month, doctors with zero patients. Built from `countDocuments` + one `$group`, no list fetch.
  - Verify: numbers equal hand-run `mongosh` counts.
- [ ] **6.2** `getChartsDB(range)` — patients per doctor (top N), registrations per day/month, patient distribution by specialization, distribution by condition — issued concurrently with `Promise.all`, each capped and index-backed.
  - Verify: `EXPLAIN` shows index use; response time stays flat as rows grow.
- [ ] **6.3** `GET /dashboard/summary` (always unfiltered) and `GET /dashboard/charts?range=7d|30d|90d|12m` with whitelisted range validation.
  - Verify: a filter applied on a list page never changes `/dashboard/summary`.

#### Frontend
- [ ] **6.4** `/` → `DashboardContent` (Server Component, guarded) → `DashboardView` with a KPI `StatCard` grid fed by `/dashboard/summary`.
  - Verify: cards show totals for all rows while tables elsewhere are filtered.
- [ ] **6.5** `components/features/dashboard/charts/*` — `PatientsPerDoctorChart` (Bar), `RegistrationsTrendChart` (Area/Line), `SpecializationShareChart` (Pie), `ConditionMixChart` (horizontal Bar) on Recharts with `ResponsiveContainer`.
  - Verify: each chart renders real seeded numbers, tooltips work, no SSR window error.
- [ ] **6.6** Dynamic-import the chart bundle (`ssr: false`) with skeletons; memoize derived series so parent updates do not re-render charts.
  - Verify: first paint HTML contains skeletons, not chart SVG; React Profiler shows no extra chart commits on filter change.
- [ ] **6.7** Range switcher in the URL (`?range=30d`), recent-activity panel, empty state when there is no data yet.
  - Verify: switching range refetches only the charts endpoint.
- [ ] **6.8** Responsive layout: 4 KPIs across on desktop, 2 on tablet, charts stack on mobile without clipping axis labels.
  - Verify: measured at 1440 / 768 / 375 px.

**Step 6 gate:** dashboard correctness proven against the database, charts visually verified on both faces. → commit both.

---

### Step 7: Performance, Hardening & End-to-End QA
**Goal**: Prove the optimization criteria in the spec rather than claim them.
**Status:** Planned

#### Backend
- [ ] **7.1** `helmet`, `compression`, request logging (dev), body-size limit, security headers, centralized async error forwarding, Mongo duplicate/cast/validation error mapping to 409/400/422.
  - Verify: response headers present; a bad ObjectId returns 400 not 500.
- [ ] **7.2** Query audit: `lean()` + projection on every list path, no `find()` without limit, `explain()` evidence captured for search/filter/pagination.
  - Verify: `IXSCAN` + `docsExamined ≤ pageSize + scanned-window` recorded per query.
- [ ] **7.3** Global rate limiter plus stricter auth limiter; graceful shutdown closes HTTP server then Mongoose.
  - Verify: `SIGINT` drains without a dangling handle.
- [ ] **7.4** Smoke suite (`node --test`) covering auth, doctors, patients, dashboard against a disposable Mongo namespace.
  - Verify: `npm test` green.

#### Frontend
- [ ] **7.5** Render audit: Server Components where data-only, narrow `"use client"` islands, `useMemo`/`useCallback` on table columns and filters, stable keys, `next/image` where relevant.
  - Verify: Profiler shows row-level re-renders only on mutation.
- [ ] **7.6** State/UX pass: loading skeletons, empty states, error states with retry, optimistic-free but non-blocking refresh, focus rings, aria labels, keyboard modal close.
  - Verify: each list page exercised with the network throttled and with an empty collection.
- [ ] **7.7** Responsive QA sweep at 375 / 768 / 1024 / 1440 px for login, dashboard, doctors, doctor detail, patients.
  - Verify: zero horizontal overflow, tap targets ≥ 44 px on mobile.
- [ ] **7.8** Full QA run as an engineer would: create → search → filter → paginate → edit → reassign → delete on both entities, plus chart accuracy against the same data set.
  - Verify: pass/fail matrix recorded in the session log with severity + file:line for defects.

**Step 7 gate:** every defect closed or explicitly deferred, both builds clean. → commit both.

---

### Step 8: Documentation, Visual Evidence & Release
**Goal**: Ship both repositories with the README template the brief mandates.
**Status:** Planned

- [ ] **8.1** Backend `README.md`: Description (elevator pitch), Features, Tech Stack, Setup Guide (step-by-step, `.env.example` table, seed), System Architecture (request flow + folder map + ERD), API Reference (every route, auth, query params, envelope), Data Model & Indexes, Performance Notes with `EXPLAIN` evidence, Technical Decisions, Testing, Troubleshooting.
  - Verify: a clean machine can clone → install → seed → run from the doc alone.
- [ ] **8.2** Frontend `README.md`: same mandated sections — Description, Setup Guide, System Architecture (RSC vs client data flow, API layer, folder map), Technical Decisions, **Visual Evidence** (desktop + mobile screenshots for login, dashboard, doctors, doctor detail, patients), Performance & Optimization, UI/UX notes, Quality Gates.
  - Verify: all five screenshots referenced with real local paths that exist.
- [ ] **8.3** Two "Technical Decisions" deep dives, written once and cross-linked: (a) cookie-based token rotation over a stateless single JWT or sessions, (b) Recharts + Server Component aggregation over client-side charting of full collections — each with the alternative considered and the measured reason for the choice.
  - Verify: each decision names the alternative rejected and the evidence.
- [ ] **8.4** Root `README.md` for the pair: what the two repos are, how to run both, ports, and the demo credentials pointer.
  - Verify: relative links to both sub-READMEs resolve.
- [ ] **8.5** Final sweep: `npm run lint && npm run typecheck && npm run build` in both repos, seeded DB verified, no `.env` in `git ls-files`, no stray scratch files, `node scripts/plan-status.mjs` reports 100 %.
  - Verify: all commands green and recorded in the session log.
- [ ] **8.6** Commit the documentation batch in both repos and report the push commands (pushing stays the user's call).
  - Verify: `git status` clean in both repos.

**Step 8 gate:** documentation complete and build/quality commands green. → commit both.

---

## Verification Protocol (applies to every step)

Run in this order; a step only advances when all applicable lines pass.

```bash
# backend
cd doctor-tracker-backend  && npm run lint && npm run typecheck && npm run build
# frontend
cd doctor-tracker-frontend && npm run lint && npx tsc --noEmit && npm run build
# runtime
curl -s http://localhost:5000/health
node scripts/plan-status.mjs        # next open item must belong to the step being closed
```

Plus, per step: the feature opened in the browser at desktop **and** 375 px, and the
database-side claim proven with `explain()` or a count comparison — not by eye.

Only then: `git add -A && git commit` in each repo with a message describing the step.
A commit cannot contain its own hash, so the Track record row for step *N* is written into
the master copy at this repository root the moment step *N* lands, and into each repo's own
copy by step *N+1*'s commit. Every copy is ticked before it is committed, never after.

## Blocked on the user

- ~~`MONGODB_URI` must be added to `doctor-tracker-backend/.env`~~ — **done 2026-11-10**: a live
  hosted cluster URI is in place, the API connects to it, and `npm run seed` has populated it.
  `MONGODB_CA_FILE` stays empty because the cluster's certificate chains to a public root.
- **Visual Evidence screenshots** in Step 8 are captured from the local dev server; if the
  browser tooling is unavailable the images are left as placeholders and flagged.
- **Pushing to GitHub** is never done automatically; the commands are reported instead.

## Session log

- **2026-11-10** — Step 2 verified and committed. Backend `probe-auth.mjs`: **15/15** against the live
  cluster — login sets `accessToken` (`Max-Age=1800`) and `refreshToken` (`Max-Age=604800`), both
  `HttpOnly; SameSite=Lax; Path=/`; no response body contains a `eyJ` token anywhere; `/auth/me` 200s
  with the jar and 401s without ("Please sign in to continue."); a tampered signature 401s; an absent
  access token with a valid refresh cookie 200s and returns a *new* pair; replaying the spent refresh
  token 401s with "This session was already used once, so it has been signed out everywhere. Please
  sign in again." and the whole family (including the good copy) is revoked; logout clears both cookies
  to `Expires=Thu, 01 Jan 1970 00:00:00 GMT`; unknown email and wrong password return byte-identical
  401 wording; the sixth bad attempt in a minute is 429 (`RateLimit: limit=5, remaining=0, reset=…`,
  `RateLimit-Policy: 5;w=60`). Two bugs found by the probe, both fixed: refresh tokens issued in the
  same second collided on the hashed-token unique index because a JWT `iat` is second-granular, so every
  issued refresh token now carries a unique `jti`; and `express-rate-limit` v8 needed
  `standardHeaders: "draft-7"` to emit the headers the probe asserts. Frontend `probe-web.mjs`:
  **15/15** against `:3000`+`:5000` — anonymous `/doctors` → 307 `/login?next=%2Fdoctors`, anonymous `/`
  → 307, the sign-in page ships no portal chrome (asserted on the drawer button and the nav links, not
  on the word "Dashboard", which the streamed not-found boundary legitimately contains), a signed-in
  visitor on `/login` → 307 `/`, a refresh cookie alone cannot render a page **and produces no
  `Set-Cookie` at all** — proof the server never spent it — while a browser-side rotation returns 200
  with both tokens replaced, the rotated pair still renders `/doctors`, and replaying the spent token
  401s. `probe-single-flight.mts`: **6/6**, run through Node's type stripping against the real
  `api-client.ts` with a stubbed `fetch` — two parallel 401s produce exactly **1** refresh call and both
  callers succeed, a failed rotation is *not* followed by a replayed mutation, and the session-lost
  notice fires once. In the browser at 1440 and 375 px: sign-out from `/patients` lands on
  `/login?next=%2Fpatients`; wrong password shows the API's inline message and keeps the field values
  minus the password; Show/Hide Password toggles; a good sign-in toasts "Signed in as QA Fixture." and
  lands on `/doctors` with the `QF` avatar; a reload keeps the session; `/login` bounces when signed in;
  the mobile drawer opens and closes; after logout `/doctors` is refused and Back shows only the form;
  console clean apart from the one expected 401. Three deviations recorded in place: the route gate is
  `src/proxy.ts` (Next 16 renamed `middleware.ts`, which still works but warns), `server-api.ts`
  forwards `accessToken` only because Next will not let `after()` write cookies during a page render —
  the browser is the single rotation authority — and `(app)/layout.tsx` sets `export const instant =
  false` so the guard is excluded from prerender validation. Browser QA ran against a throwaway fixture
  admin created and dropped by `dist/qa-user.mjs` (`sessions cleared: 2` on teardown); the real seeded
  credentials were never read, printed or served. `lint`, `tsc --noEmit` and `build` green in both repos.
- **2026-11-10** — Step 1 verified and committed. `doctor-tracker-backend/.env` now holds a live
  hosted-cluster URI (no CA file needed: the certificate chains to a public root), and
  `npm run db:inspect` — the read-only probe added with this step — reports users 1 / doctors 12 /
  patients 60. Index lists match the models exactly: `users` `email` unique; `doctors` unique
  `email` + `phone`, the three lowercase mirrors, `{specialization:1,createdAt:-1}`, `{createdAt:-1}`;
  `patients` `{doctorId:1,visitDate:-1}`, `{condition:1,visitDate:-1}`, `{visitDate:-1}`,
  `nameLower`, unique `phone`, sparse `emailLower`. `EXPLAIN` (executionStats) on the three shapes
  the portal will run: `doctors` search `^ana` → SORT › FETCH › IXSCAN, keys 2 / docs 1 / returned 1;
  `patients` one roster page 2 (skip 2, limit 2) → LIMIT › FETCH › SKIP › IXSCAN, keys 4 / docs 2 /
  returned 2; `patients` condition + date sort → LIMIT › FETCH › IXSCAN, keys 3 / docs 3 / returned 3.
  No collection scans, and `docsExamined` never exceeds the window it returns. Duplicate doctor email
  and duplicate patient phone are both rejected with `MongoServerError` code 11000 (Step 3 maps those
  to 409), and a patient without `doctorId` fails schema validation before the write.
  `npm run seed` twice → `created 0, unchanged 12`, `unchanged 60`, identical totals, and the second
  run leaves the admin's stored hash untouched. Failure paths proved too: an unreachable URI logs
  four backoff lines (400/800/1600/3200 ms) then exits 1, an empty `MONGODB_URI` exits 1 immediately.
  Frontend: a throwaway probe page rendered `server-ok:ok:development` through `lib/server-api.ts`,
  `browser-ok:ok:development` through `apiClient` in a real browser (so the cross-origin
  `credentials: 'include'` call clears the CORS allow-list), and `error:404` carrying the API's own
  message — the page was deleted after the run and `next build` prerenders the four real routes.
  Two notes for later steps: password hashing uses the pure-JS bcrypt implementation (same API, no
  native build step), and Mongoose 9 deprecates `validateSync()` in favour of `await validate()`.
- **2026-11-10** — Step 0 verified and committed in both repositories. Backend: `lint`,
  `typecheck`, `build` green; `GET /health` returns the success envelope, an unknown path
  returns the 404 envelope, and the CORS allow-list answers with `Access-Control-Allow-Credentials`.
  Frontend: `lint` and `tsc --noEmit` green, `next build` prerenders `/`, `/doctors`, `/patients`
  and `/not-found`; the chrome was measured at 1440 (rail 288 px, content offset 288 px, header
  64 px), 768 and 375 px (drawer opens over a backdrop, closes on Escape, no horizontal overflow),
  and `/doctors` carries exactly one `<h1>`. 14 UI primitives, 5 shared chrome components and the
  `PaginationMeta` contract are in place. `.env` is ignored in both repos, `.env.example` tracked.
  The frontend `README.md` is still the scaffold boilerplate on purpose — Step 8 replaces it.
- **2026-11-10** — Requirements read from the PDF brief; both reference stacks inspected.
  Plan written (Steps 0–8, parallel backend/frontend slices). Decisions locked with the
  user: plan mirrored in both repos, httpOnly cookie auth with refresh rotation, seeded
  admin with no public signup, hosted MongoDB URI to be supplied before Step 1. Nothing
  implemented yet — Step 0 is the next open item.
