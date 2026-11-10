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
- [x] **Step 3: Doctor Management — CRUD, Search, Filter, Pagination** *(Verified & Committed)*
- [x] **Step 4: Patient Management — Dedicated Page, CRUD, Filters** *(Verified & Committed)*
- [ ] **Step 5: Doctor ↔ Patient Relations — Detail View & Sub-lists** *(Planned)*
- [ ] **Step 6: Dashboard & Analytics — Recharts Visual Insights** *(Planned)*
- [ ] **Step 7: Performance, Hardening & End-to-End QA** *(Planned)*
- [ ] **Step 8: Documentation, Visual Evidence & Release** *(Planned)*

### Track record

| Step | Scope | Backend commit | Frontend commit | Status |
| ---- | ----- | -------------- | --------------- | ------ |
| 0 | Bootstrap | `21c6760` | `301bae0` | Verified & Committed |
| 1 | Data layer | `fe732a2` | `ec63f0d` | Verified & Committed |
| 2 | Auth | `7e1ed5a` | `49b6d58` | Verified & Committed |
| 3 | Doctors | `af95512` | `aaf2d6f` | Verified & Committed |
| 4 | Patients | — | — | Verified & Committed |
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
- [x] **1.3** `src/modules/doctor/doctor.model.ts` — `name`, `specialization`, `hospital`, `phone`, `email` (unique), lowercase mirrors, timestamps. Indexes: `{ email: 1 }` unique, `{ phone: 1 }` unique, `{ nameLower: 1 }`, `{ specializationLower: 1 }`, `{ hospitalLower: 1 }`, `{ specialization: 1, createdAt: -1 }`, `{ hospitalLower: 1, createdAt: -1 }` (added by Step 3 so the hospital filter never sorts in memory), `{ createdAt: -1 }`.
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
**Status:** Verified & Committed

#### Backend
- [x] **3.1** `doctor.schema.ts` — create/update/pagination-query/list-query zod schemas (email, phone format, min lengths, `limit` cap, ISO date bounds, sort whitelist).
  - `updateDoctorSchema` is `createDoctorSchema.partial()` with a `superRefine` that refuses an empty
    patch, so a form that changed nothing cannot answer "saved". Blank query parameters are stripped
    before parsing — a half-typed `?page=` in an editable address bar is "no filter", not a 400.
  - Verify: `page=abc`, `page=0` and an oversized `pageSize` each return 400 naming the field.
- [x] **3.2** `doctor.service.ts` list pipeline: single `$match` from search + specialization + hospital + date range, `countDocuments` → `skip`/`take` → projection with `lean()`, sorted by a whitelisted key.
  - Delivered as one aggregation rather than `find().lean()`, because each row also needs its roster
    size: `$match → $sort → $skip → $limit → $lookup(count) → $project`, so the roster is counted for
    the ten surviving rows instead of one count query per doctor. `countDocuments` still answers the
    total. The `$project` is inclusion-only — MongoDB refuses a projection that mixes the two.
  - The sort whitelist maps to lowercase mirror fields (`-name → {nameLower:-1}`), and
    `{ hospitalLower: 1, createdAt: -1 }` was added to the model so the hospital filter never sorts in
    memory. Search is anchored and case-sensitive against `nameLower`/`specializationLower`/`hospitalLower`.
  - Query strings are parsed inside the controller, not in `validateSchema`: Express 5 defines
    `req.query` as a getter, so middleware cannot replace it. `globalError` maps `ZodError` to the same
    400 field envelope the middleware produces.
  - Verify: `explain()` at 5 012 rows — see the load probe in the session log; page 2 returns different ids.
- [x] **3.3** `doctor.controller.ts` + `doctor.route.ts` — `GET /doctors`, `POST /doctors`, `GET /doctors/:id`, `PATCH /doctors/:id`, `DELETE /doctors/:id`, `GET /doctors/meta/filters` (distinct specializations + hospitals for the dropdowns).
  - `/meta/filters` is declared before `/:id` so the word "meta" is never handed to the identifier
    route. `PATCH` assigns then saves rather than using `findOneAndUpdate`, because the lowercase
    mirrors are maintained by the model's `pre("save")` hook.
  - New `utils/mongoError.ts` turns write conflicts into the API's own error shapes: duplicate key 11000
    → 409 pinned to the offending field (`email`, `phone`), `CastError` → 400, Mongoose
    `ValidationError` → 400 per path. The unique indexes are the real guard, so there is no pre-flight
    query that could pass and then lose the race.
  - Verify: every verb through the contract probe, duplicate email/phone → 409 with the field message,
    unknown-but-valid id → 404 (not 500), malformed id → 400 on the `id` field.
- [x] **3.4** Delete semantics: removing a doctor removes or unassigns its patients inside one transaction (or ordered fallback), and the response reports the affected count.
  - `session.withTransaction` over `Patient.deleteMany` + `Doctor.deleteOne`; the hosted replica set
    supports transactions, so a patient whose doctor is gone can never be observed. The response
    reports `{ id, name, patientsRemoved }` and the message names the count.
  - Verify: 60 + 3 fixture patients → 60 after the delete, with `patientsRemoved: 3`, and zero orphans.

#### Frontend
- [x] **3.5** `/doctors/page.tsx` Server Component + `Suspense` + `DoctorsContent` that reads URL search params, calls `GET /doctors`, and hands the payload to `DoctorsView`.
  - `page.tsx` renders only the `Suspense` boundary; `DoctorsContent` awaits the list and the filter
    options together, and its fallback is `DoctorsSkeleton` — the page shape with the words taken out,
    so arriving data moves nothing.
  - A failed read is answered in place (`loadError` card, empty table, filters still usable) instead of
    throwing at the viewer, and the page it hands down is the page the API actually served — the API
    clamps a page past the last one, and the view must push the clamped number, not the stale one.
  - Verify: the served document contains row data and the skeleton markup before the rows stream in.
- [x] **3.6** Shared `PageHeader` with `DoctorsActions` (create button) and `DoctorsSection` (state in URL, transition-guarded navigation, `router.refresh()` after mutations).
  - Delivered as `DoctorsView` rather than `DoctorsSection`; the file owns the whole client surface of
    the page, so the name says what it is.
  - The address bar is the only state: a filter push re-renders the server read for the new URL, and a
    write keeps the URL and calls `router.refresh()`. Between a push and the render that answers it the
    props still describe the previous URL, so patches are built from a ref that is cleared the moment
    new props land — two quick filter changes cannot discard the first, and a browser back/forward
    restores authority to the server's read.
  - Verify: back/forward restores search + page (proven on `?sort=name` → `&page=2`); one debounced
    keystroke burst produces exactly **1** RSC request; create/edit/delete revalidate the same URL.
- [x] **3.7** `DoctorsFilters` — `SearchInput` (debounced, name/specialization/hospital) + specialization + hospital + date-from + date-to dropdowns in `FilterBar`, with a Reset control when any filter is active.
  - Five controls in the bar, which is the odd count that gives the search box its own row at phone
    width. Sort is *not* a sixth bar control: it rides in the results row beneath it with the Reset
    button, so a view preference never displaces a filter. Reset is offered only while the URL actually
    carries something, which `hasQueryState` decides from the same codec that writes the URL.
  - Specialization and hospital options come from `GET /doctors/meta/filters`, so the dropdowns list
    what the practice holds; the create form offers the curated list instead.
  - Verify: each filter produces a server request at `page=1` (`?specialization=Cardiology`,
    `?hospital=…`, `?from=2026-09-01&to=2026-09-10`, `?sort=name`), reset returns the URL to bare.
- [x] **3.8** `DoctorsTable` over `DataTable` — name (semibold, capped width), specialization + hospital as quiet text lines, phone, email, created date, patient count link, actions; `renderCard` mirrors the same field order at 375 px.
  - Both faces carry the same seven fields in the same order; the count becomes a link in Step 5, when
    the doctor detail page exists to link to. Captions moved to one shared `FieldCaption` so the card
    rows and the filter labels are the same voice.
  - Verify: at 375 px `scrollWidth == clientWidth` (no horizontal scroll) with the table hidden and the
    cards shown; at 1440 px the reverse; exactly one badge per row on either face.
- [x] **3.9** `DoctorFormModal` — create/update with client validation, server error mapping, "Create New"/"Save Changes" labels, `Button` variants reused from the shared primitive; delete through `confirmDelete`.
  - The form is an inner component mounted only while the dialog is open, so it seeds itself once on
    mount instead of watching the record — a reopened dialog cannot carry over the previous doctor's
    values or a stale message. Client rules mirror `createDoctorSchema` string for string, and a
    rejected write pins the API's field errors to the same inputs and stays open.
  - Verify: empty submit shows the five field messages and red borders; create toasts and the row
    appears at the top of page 1 (total 12 → 13); a duplicate email 409s onto the email field; edit
    seeds from the record, renames the hospital and the new value survives the revalidation; delete
    confirms, toasts and the row is gone (13 → 12).
- [x] **3.10** `Pagination` bound to the API `{ page, pageSize, total, totalPages }` meta.
  - Hidden when the result set is empty, so "Showing 0 to 0 of 0 entries" never sits under an empty
    table.
  - Verify: "Showing 1 to 10 of 12" unfiltered, "1 to 1 of 1" for `?search=card`, "11 to 12 of 12" on
    page 2 — each matches the server `total`.

**Step 3 gate:** CRUD + every filter verified in the browser at desktop and phone widths, curl contract checks, lint/typecheck/build. → commit both.

---

### Step 4: Patient Management — Dedicated Page, CRUD, Filters
**Goal**: The standalone patients page the spec asks for, with condition and date filtering.
**Status:** Verified & Committed

#### Backend
- [x] **4.1** `patient.schema.ts` — create/update/list-query schemas including `condition`, `doctorId` (valid ObjectId), gender enum, age bounds, `visitDate`, date range, sort whitelist.
  - Create and update share one body schema (`updatePatientSchema` is its partial plus a "send at least one
    field" guard), and the query schema owns the page/pageSize caps, the sort whitelist and the visit window,
    so a malformed URL is answered with a field message instead of a Mongo error.
  - Verify: `dist/probe-patients.mjs` — **47/47**. A malformed `doctorId` is a 400 "That doctor identifier is
    not valid." on create *and* in the query string, before Mongo is asked; a well-formed id that is not in the
    practice is a 404 "That doctor is not in the practice list."; an unknown sort key is 400 "That sort order
    is not supported." and `createdAt` is refused because no index backs that order; `from` after `to` is 400
    "Start date is after the end date."; a non-ISO date is 400 "Provide a date as YYYY-MM-DD."; `page=abc` and
    `pageSize=101` each name their own field; a blank parameter is "no filter", not an error.
- [x] **4.2** `patient.service.ts` — same `$match` → count → `skip`/`take` shape, plus `$lookup` (or `$in` batch) so each row carries `doctorName`/`doctorSpecialization` without N+1 queries.
  - One aggregation carries the whole page: `$sort`/`$skip`/`$limit` run *before* the `$lookup`, so at most ten
    doctors are joined per request, and the join projects only the summary a row shows. Deviation from the `$in`
    batch alternative: fetching the page's doctors in a second query makes one list request two queries plus the
    count, and the pipeline already answers both in one.
  - Deviation in the shape handed to the client: instead of flat `doctorName`/`doctorSpecialization` columns a
    row carries `doctor: { id, name, specialization } | null`, so the table, the form and (in Step 5) the
    profile header read the same object, and a missing doctor is `null` rather than an empty string.
  - `{ gender: 1, visitDate: -1 }` was added to the model for this item: the gender filter was the one
    predicate whose visit-date order the existing indexes could not serve, so it `SORT`ed in memory.
  - Verify: `dist/probe-patients-load.ts` — **9/9** with 5 000 fixture patients written over the seeded 60,
    explaining the pipelines `listPatients` actually sends rather than a hand-written imitation: browse page 3
    newest-first `LIMIT › PROJECTION_SIMPLE › FETCH › SKIP › IXSCAN` docs 10 / keys 30 / 2 ms; name-prefix
    search `SUBPLAN › PROJECTION_SIMPLE › SORT › FETCH › OR › IXSCAN` docs 10 / keys 11; one doctor's roster, a
    condition inside a window and gender-plus-sort all `… › FETCH › IXSCAN` docs 10 / keys 10, their counts from
    `COUNT_SCAN` at keys 422, 65 and 1 687. The unfiltered counts are the whole-collection scan by definition
    (docs 5 060 / 2 ms) and asserted as that shape so a leak can never pass for one. One list request is one
    count plus one aggregate however large the page, and a patient whose doctor row is gone lists with
    `doctor: null` instead of disappearing from the page.
- [x] **4.3** `patient.controller.ts` + `patient.route.ts` — `GET /patients`, `POST /patients`, `GET /patients/:id`, `PATCH /patients/:id`, `DELETE /patients/:id`, `GET /patients/meta/filters` (distinct conditions).
  - Mounted in `router.ts` behind the same `authenticate` + `authorize("admin")` pair as `/doctors`. The meta
    route answers distinct conditions *and* every assignable doctor, because the form needs a doctor list and a
    page of rows cannot supply one — a doctor nobody visited this month is still assignable.
  - Verify: create with a non-existent doctor is a 404 and writes nothing; `PATCH` reassigns and the counts
    follow on both rosters (A 7 → 6, B 5 → 6) with the moved row found under its new doctor; `DELETE` removes
    only that row (63 → 62) and answers with the name it removed; a second delete and an unknown id are both
    404 while a malformed id is a 400 on the `id` field; `GET /patients/meta/filters` lists 33 conditions and
    12 doctors, both ordered; every route is a 401 without a session.
- [x] **4.4** Duplicate-phone guard and `visitDate` default to now when omitted.
  - The unique index on `phone` is the guard and the service turns the duplicate-key error into a 409 pinned to
    the field. Email is deliberately **not** unique on a patient — a household shares an address — so the
    `emailLower` mirror is sparse and exists for search only, unlike the doctors collection.
  - Verify: a second insert with the same phone → 409 "That phone number is already in use."; an omitted
    `visitDate` is filed as the moment the request lands (2026-11-10T09:45:00.298Z) and an omitted `email`
    stays absent from the document instead of being stored as an empty string.

#### Frontend
- [x] **4.5** `/patients/page.tsx` + `PatientsContent` + `PatientsView` mirroring the doctors page.
  - `page.tsx` is only the `Suspense` boundary; `PatientsContent` awaits the list and the filter options and
    answers a failure in place — `PatientsSkeleton` for the fallback, and on an error the filters, an empty
    table and the reason the rows did not arrive. Both reads are `allSettled`, so a rejected *list* still hands
    down the options the dropdowns need, and the banner quotes the API's own field sentence
    (`apiPrimaryError`) instead of the generic envelope. The page the view pushes is the page the API served.
  - Deviation: the doctors page got the same two changes in the same sweep, so neither list page can blank its
    own filters when its rows fail.
  - Verify: deep links `/patients?search=Nik`, `?condition=…&gender=female` and `?page=2`, and the three
    together, render exactly those rows in the served document before any script runs; a 400 URL
    (`?from=2026-12-31&to=2026-01-01`) shows "Start date is after the end date." with the doctor names in the
    rows still resolved.
- [x] **4.6** `PatientsFilters` — search (name/phone/email), condition dropdown, doctor dropdown, date range, reset.
  - The same bar as the doctors page — five controls, sort riding in the results row beneath it rather than
    inside it, and Reset offered only while the URL actually carries state. Condition and doctor options come
    from `GET /patients/meta/filters`; the gender dropdown prepends an explicit "All genders" entry so the
    empty URL and the reset choice are the same thing.
  - Deviation: the phone arm of the search is prefix-anchored on the unique `phone` index, so a term has to
    start where the stored number starts — `4155551009` finds nothing while `+14155551009` is its own match,
    and the term is only read against `phone` when it is all digits. An unanchored pattern would turn the
    collection's one unique index into a scan; the name and email arms are anchored for the same reason.
  - Verify: `?search=Nik` → 7 rows, a digits term matches the phone column, an email local-part matches
    `emailLower`; condition → 2 rows, one doctor → 7 rows, `?gender=male` → 18 rows, and filters AND together
    with search; every change lands on `page=1` and Reset returns the URL to bare. The options the two
    dropdowns list are the API's 33 conditions and 12 doctors, not a client-side list.
- [x] **4.7** `PatientsTable` + mobile card — name, contact, condition (single badge), assigned doctor, visit date, actions (edit/delete/view doctor link).
  - Both faces carry the fields in one order — patient, condition, contact, doctor, last visit — then the two
    icon actions. The doctor cell links to `/doctors?search=<name>` until Step 5 gives it a profile page to
    link to, and a null doctor reads "Unassigned" instead of an empty cell.
  - Deviation: the condition column moved ahead of contact so the desktop and phone faces agree; they had been
    mirroring different orders.
  - Verify: at 1280 px the head row reads `Patient / Condition / Contact / Doctor / Last visit` with the cards
    hidden; at 375 px `scrollWidth 360 == clientWidth 360` with the table hidden and the cards shown, one
    condition badge per row and no horizontal scroll; the orphan patient shows "Unassigned" on either face.
- [x] **4.8** `PatientFormModal` — includes a searchable doctor select; create and update flows, confirm-delete.
  - `Dropdown` grew a `searchable` prop — a type-to-filter box that takes the first match on Enter and is off
    by default, so every existing caller keeps the plain listbox — because twelve doctors with their
    specializations is not a list anyone scans. The form mounts only while the dialog is open, so it seeds once
    from the record and cannot carry the previous patient's values or message; a doctor who is no longer on the
    roster is still offered as that patient's own choice, so an unrelated edit cannot silently move them.
    Client rules mirror `createPatientSchema` string for string, and a rejected write pins the API's field
    errors to the same inputs and stays open.
  - Two payload rules the server forced, each commented where it is written: a blank optional field is sent as
    `""`, because JSON drops `undefined` and the server reads that as "this field was not touched" while the
    empty string is what its preprocess turns into `$unset` — except `visitDate`, where a blank is omitted
    because `""` would be a 400. And `noValidate` on this form and the doctors form, because the messages worth
    reading are this app's, and a browser bubble says the same thing in the operating system's voice before
    they arrive.
  - Verify: an invalid submit names every field in the schema's own words; create toasts and the row appears on
    page 1; a duplicate phone keeps the dialog open with the API's 409 on that field; a patient moved from
    doctor A to doctor B changes the count shown on both rosters and the row is found under its new doctor
    after the refresh; clearing the email survives revalidation ("No email"); confirm-delete takes the
    condition into its sentence and the row is gone. One filter change produces exactly **1** RSC request
    (`GET /patients?gender=female&_rsc=…`) and one debounced keystroke burst produces one.

**Step 4 gate:** full patients CRUD + filter matrix verified in the browser at 1280 and 375 px, backend contract probe **47/47** and index-backed load probe **9/9**, lint/typecheck/build clean in both repos. → commit both.

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

- **2026-11-10** — Step 4 verified and committed. Backend `dist/probe-patients.mjs`: **47/47** against the live
  cluster — `meta/filters` answers 33 distinct conditions and all 12 assignable doctors, both ordered; the list
  returns rows plus full meta (`total 60 / pages 15`) with no lowercase mirror leaking and the joined doctor
  summary on every row; default order is `visitDate` descending and `sort=name` runs A→Z off `nameLower` while
  `createdAt` is refused; a malformed `doctorId` is a 400 on create **and** in the query string before Mongo is
  asked, a well-formed ghost id a 404; a duplicate **phone** 409s onto the phone field; a five-field-invalid
  create returns all five names; `PATCH` reassigns with the counts following on both doctors (A 7→6, B 5→6) and
  the mirrors following the edit; an optional field cleared in the form is removed rather than stored empty; an
  empty patch is refused; `DELETE` takes one row out (63 → 62) and reports its name, and a second delete or an
  unknown id is a 404 while a malformed id is a 400 on `id`; a patient whose doctor row is gone lists with
  `doctor: null` instead of disappearing. Backend `dist/probe-patients-load.ts` (run through `tsx`, explaining
  the pipelines `listPatients` itself sends): **9/9** at 5 060 patients — browse page 3 `LIMIT ›
  PROJECTION_SIMPLE › FETCH › SKIP › IXSCAN` docs 10 / keys 30 / 2 ms, name-prefix search `SUBPLAN ›
  PROJECTION_SIMPLE › SORT › FETCH › OR › IXSCAN` docs 10 / keys 11, doctor roster / condition-in-a-window /
  gender-with-visit-sort all `… › FETCH › IXSCAN` docs 10 / keys 10 with their counts from `COUNT_SCAN` at keys
  422, 65 and 1 687, the unfiltered counts asserted as the deliberate whole-collection scan (docs 5 060, 2 ms),
  one list request proven to be a count plus one aggregate at any page size, and the 5 000 fixture rows deleted
  again (`patients now 60, doctors 12`). The `{ gender: 1, visitDate: -1 }` index was added to the model for
  this step: the gender filter was the one predicate whose sort ran in memory. Frontend, in a real browser
  against `:3000` + `:5000` as a throwaway fixture admin: `/patients` serves its rows, filter bar and meta line
  in the document before any script runs; `?search=Nik` → 7 rows, condition → 2, one doctor → 7,
  `?gender=female` → the dropdown's own list, combinations AND together, each change landing on `page=1`, with
  Back/Forward restoring the URL and its rows and Reset returning the address to bare. **1** RSC request per
  filter change (`GET /patients?gender=female&_rsc=…`) and one per debounced keystroke burst. CRUD: an invalid
  submit names every field in the schema's own words; a create toasts and lands on page 1; a duplicate phone
  keeps the dialog open with the API's 409 on that field; moving a patient from doctor A to doctor B changed the
  count on both rosters; clearing the email survived revalidation ("No email"); confirm-delete quotes the
  patient's own condition and the row is gone. Widths probed through same-origin iframes: 1280 px shows the
  table with heads `Patient / Condition / Contact / Doctor / Last visit`, 375 px `scrollWidth 360 ==
  clientWidth 360` shows the cards in that order with one condition badge each and hides the table, and the
  orphan patient reads "Unassigned" on either face. Deviations recorded in place: the page's join is a `$lookup`
  after `$limit` inside the same aggregation rather than an `$in` batch; a row carries
  `doctor: { id, name, specialization }` instead of flat `doctorName`/`doctorSpecialization` columns; the
  search's phone arm is prefix-anchored, so a term must begin where the stored number begins; `Dropdown` gained
  `searchable` (off by default); both list pages read their two calls with `Promise.allSettled` and report
  through `apiPrimaryError`, which swept the doctors page too; both form dialogs run `noValidate`; and a blank
  optional field is sent as `""` — the value the server preprocesses into `$unset` — while a blank visit date is
  omitted. QA hygiene: the browser ran on the fixture admin created and dropped by `dist/qa-user.mjs` (teardown
  `sessions cleared: 1`), the unassigned row came from `dist/qa-orphan.mjs` and was removed again, the real
  seeded admin's credentials were never read, printed or served, and the cluster ended at 12 doctors / 60
  patients. Toolchain notes: a synthetic `submit()` never reaches a portal form's React handler, so every write
  in the matrix was driven by a trusted click, while the native value setter plus an `input` event does drive a
  controlled input; and a `next build` taken while the dev server is live rewrites `tsconfig.json`'s `include`,
  so this step's build ran into a scratch `distDir` that was deleted and `tsconfig.json` returned to its
  committed form before committing. Backend `lint`, `typecheck`, `build` and frontend `lint`, `tsc --noEmit`,
  `build` all green; `/patients` stays dynamic (`ƒ`) in the build output alongside `/doctors`.
- **2026-11-10** — Step 3 verified and committed. Backend `dist/probe-doctors.mjs`: **35/35** against the
  live cluster — `page=abc` / `page=0` / `pageSize=101` each answer 400 naming the field, a blank
  parameter is "no filter" rather than an error, the list is closed without a session (401), `POST`
  returns 201 with `patientCount: 0`, a duplicate **email** and a duplicate **phone** each 409 pinned to
  their own field, a five-field-invalid create returns all five field names, the detail route returns the
  roster *count* and not the roster, `PATCH` renames the record and the lowercase mirrors follow it (a
  search on the new hospital finds it in the same second), an empty patch is refused instead of
  pretending to save, an unknown-but-well-formed id is 404 on both `GET` and `DELETE` while a malformed
  one is 400 on the `id` field, and the cascade is measured against a baseline taken *before* three
  fixture patients land: 60 + 3 → 60 with `patientsRemoved: 3` reported and zero orphans. Backend
  `dist/probe-load.ts`: **5/5** at 5 012 doctors, explaining the pipeline the service actually ships —
  browse newest-first `LIMIT › PROJECTION_SIMPLE › FETCH › SKIP › IXSCAN` docs 10 / keys 30 / 1 ms,
  name-prefix search `SUBPLAN › PROJECTION_SIMPLE › SORT › FETCH › OR › IXSCAN` docs 10 / keys 12,
  specialization + date sort and hospital + created window both `… › FETCH › IXSCAN` docs 10 / keys 10,
  and the counts answered without touching documents: `COUNT_SCAN` keys 1001 (specialization) and keys
  101 (hospital) at docs 0. The one legitimate `COLLSCAN` is the *unfiltered* total, which by definition
  counts the whole collection (5 012 docs, 2 ms) — the probe asserts that shape separately so it can
  never be mistaken for a leaked scan. Five 000-row fixture doctors were deleted afterwards; `12 doctors
  / 60 patients` verified twice. Things the toolchain forced: Express 5 defines `req.query` as a getter,
  so query parsing moved into the controller with `ZodError → 400` added to `globalError` (Mongoose 9 has
  no `FilterQuery` — the ambient type is `QueryFilter` — and `$sort` wants `Record<string, 1 | -1>`, not a
  `SortOrder`); MongoDB refuses a `$project` that mixes inclusion with exclusion; `countDocuments(…).explain()`
  resolves to a bare number, so the count's own aggregation pipeline is explained instead; an explain
  counters block must be read from the *outermost* `executionStats`, because a pipeline that splits for
  `$lookup` carries one per branch; and the hospital filter in-memory `SORT`ed until
  `{ hospitalLower: 1, createdAt: -1 }` was added to the model. Frontend, in a real browser against
  `:3000` + `:5000` as a throwaway fixture admin: the served document carries rows, the filter bar and
  the meta line *before* any script runs, and the `Suspense` fallback is in the same stream, so a slow
  read shows the skeleton rather than a blank page. `?search=card` produced exactly **1** RSC request
  (`GET /doctors?search=card&_rsc=…`) and narrowed 12 → 1; the specialization and hospital dropdowns —
  filled from `meta/filters`, 7 hospitals — compose (`?specialization=Cardiology&hospital=Meridian+General+Hospital`);
  `?from=2026-09-01` → Priya Nair + Hana Kim, `&to=2026-09-10` → Hana Kim alone (a day-wide window);
  `?sort=name` reorders on the `nameLower` mirror; page 2 reads "Showing 11 to 12 of 12 entries" and
  Back/Forward restore `?sort=name` and `?sort=name&page=2` with their rows; Reset returns the URL to
  bare and removes itself. CRUD: an empty submit lists all five field messages and reddens the four
  inputs; a create toasts "QA Step3 Fixture was added to the practice.", closes the dialog and lands on
  page 1 (total 12 → 13); the same email twice keeps the dialog open with the API's own 409 sentence on
  the email field; edit opens seeded ("Edit Doctor", specialization showing *Cardiology*, "Save Changes")
  and the renamed hospital survives revalidation; delete confirms with "This doctor has no patients.",
  toasts and returns the list to 12. Widths probed through same-origin iframes: 375 px `scrollWidth 360
  == clientWidth 360` with the table hidden and the cards shown, 1440 px the reverse, and exactly one
  badge per row on both faces. Deviations recorded in place: the page-level aggregation replaces
  `find().lean()` (roster sizes in one round trip), the client section is `DoctorsView` rather than
  `DoctorsSection`, and sort rides under the filter bar instead of inside it. `pageSize` stays at the
  default 10 — no rows-per-page control is in the brief. QA hygiene: the browser ran on the fixture
  account created and dropped by `dist/qa-user.mjs` (teardown `sessions cleared: 1`) and the fixture
  doctor written through the UI; the real seeded admin's credentials were never read, printed or served,
  and the cluster ended at 12 doctors / 60 patients. One tooling note: the first sign-in attempt appeared
  to fail because a navigation was issued immediately after the click, which aborted the `POST` — the app
  behaved correctly by refusing `/doctors` and returning to `/login?next=%2Fdoctors`. Backend `lint`,
  `typecheck`, `build` and frontend `lint`, `tsc --noEmit`, `build` all green; `/doctors` stays dynamic
  (`ƒ`) in the build output.
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
