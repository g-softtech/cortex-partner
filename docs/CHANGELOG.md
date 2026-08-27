# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased] — Phase 7 In Progress

---

## [0.7.0] — 2026-08-27 — Phase 6 Project Submission Complete

### Added
- `src/lib/validations/project.ts` — `projectSubmissionSchema` for robust data validation on incoming projects.
- `src/app/api/projects/route.ts` — API endpoint for creating new projects with in-memory rate limiting.
- `src/app/(dashboard)/projects/new/page.tsx` — front-end submission form integrated with `react-hook-form` and custom `zodResolver`.
- Modified `/dashboard` and `/projects` to include visible Call-to-Action buttons for project submission.
- Programmatic security test script explicitly designed to verify data boundaries during project creation.

### Security
- **Strict Ownership:** `POST /api/projects` completely ignores any `partnerId` provided in the payload and exclusively binds newly created projects to the authenticated user derived from `requirePartnerSession()`.
- **Atomic Concurrency:** Concurrency-safe unique project numbering (`CPJ-XXXXX`) achieved via Prisma `$transaction` and atomic `sequence` upsertion.
- **Mass Assignment Prevention:** Incoming request bodies are safely parsed using Zod, and explicitly mapped to the `db.project.create` inputs.
- **Data Filtering:** `POST /api/projects` response explicit `select` returns only `id` and `projectNumber` for navigation, avoiding inadvertent leakage of auto-initialized fields or internal metadata.

---

## [0.6.0] — 2026-08-27 — Phase 5 Partner Dashboard Complete

### Added
- `requirePartnerSession()` in `src/lib/auth/session.ts` — strict server-side validation of `UserRole.PARTNER` and existence of `Partner` database record.
- `src/middleware.ts` updated to strictly enforce `PARTNER` role on `/dashboard`, `/projects`, and `/profile`.
- `src/app/(dashboard)/layout.tsx` — responsive layout with sidebar navigation and mobile top-bar.
- `/dashboard` overview page showing Partner ID, statistics, and recent projects.
- `/projects` page for listing all projects owned by the partner.
- `/profile` page for read-only view of partner account details.
- Integrated `SignOutButton` using `next-auth/react`.

### Security
- **IDOR Protection:** `src/app/(dashboard)/projects/[id]/page.tsx` checks `project.partnerId === partner.id` and returns `notFound()` if unauthorized, preventing enumeration of other partners' projects.
- **Strict Data Pruning:** Explicit `select` objects used in Prisma queries for all partner-facing views.
- **Admin Data Isolation:** `adminNotes` and `opportunityStatus` are strictly excluded from the partner dashboard queries.
- **Admin Denial:** `UserRole.ADMIN` accounts are denied access to partner routes, enforcing separation of privileges.

---

## [0.5.0] — 2026-08-27 — Phase 4 Authentication Complete

### Added
- `bcryptjs@2.4.3` and `@types/bcryptjs@2.4.6` installed
- Real bcrypt password validation in Auth.js credentials provider (`src/lib/auth/options.ts`)
- `POST /api/auth/setup-account` — validates SHA-256 token hash, enforces expiry and single-use, atomically sets password and consumes token
- `/login` page with real credentials form and role-aware redirect (ADMIN → `/admin`, PARTNER → `/dashboard`)
- `/setup-account?token=` page with password creation and confirmation UI
- `scripts/bootstrap-admin.ts` — interactive admin account creation script with hidden password prompt, email/password validation, and duplicate-account guard
- `scripts/test-token-flow.ts` — programmatic Phase 4 security test runner

### Security
- Setup tokens stored as SHA-256 hash only — never plaintext in DB
- Token consumption and password update are a single atomic Prisma transaction
- Expired tokens (expiresAt < now) are rejected before any write
- Consumed tokens (consumedAt IS NOT NULL) cannot be reused
- Invalid/missing credentials return generic error — no email-existence disclosure
- Admin user passwords are never returned by any API route
- Bootstrap script never prints password or hash to terminal

## [0.4.0] — 2026-08-27 — Phase 3 Admin Application Management Complete

### Added
- Admin UI for listing partner applications (`/admin/partner-applications`)
- Admin UI for viewing detailed partner application (`/admin/partner-applications/[id]`)
- API endpoints for partner applications list and detail retrieval
- API endpoint for application status transitions (Approve, Decline, Request More Info)
- Atomic database transaction for application approval (creates User, Partner with auto-generated ID, and AccountSetupToken)
- Admin auth guards implementation placeholder in `authOptions`

---

## [0.3.0] — 2026-08-27 — Phase 2 Application System Complete

### Added
- Fixed lint errors and completed server-side validations

---

## [0.2.0] — 2026-08-26 — Phase 1 Public Partner Program Complete

### Added
- Prisma Client singleton (`src/lib/db/index.ts`)
- In-memory rate limiting service for API abuse protection (`src/lib/services/rate-limit.ts`)
- Partner Application Zod schema and custom lightweight resolver (`src/lib/validations/partner.ts`, `src/lib/validations/resolver.ts`)
- `POST /api/partners/apply` route with concurrency-safe sequence ID generation
- Landing page (`/`)
- Partner Application form page (`/apply`)
- Application Success page (`/application-success`)

---

## [0.1.0] — 2026-08-26 — Phase 0 Foundation Complete

### Added
- Repository initialized with `create-next-app@14.2.15`
- Frozen dependency stack: Next.js 14.2.15, React 18.3.1, TypeScript 5.5.4, Prisma 5.21.0, next-auth 4.24.7, Tailwind 3.4.14, zod 3.23.8, react-hook-form 7.53.0
- `.nvmrc` pinned to Node `22.16.0`
- `package.json` engines field set to Node `22.16.0`
- `.env.example` with documented placeholders
- `.gitignore` updated to exclude `.env`, `.env.development`, `.env.production`
- `prisma/schema.prisma` — full approved schema with all models, enums, FK constraints, and indexes
- Initial migration `20260826220002_init` applied to `cortex_partner_dev` (Neon PostgreSQL 16)
- Prisma Client v5.21.0 generated
- `/docs` documentation continuity system:
  - `PROJECT_STATUS.md`
  - `ROADMAP.md`
  - `ARCHITECTURE.md`
  - `DATABASE.md`
  - `SETUP.md`
  - `ENVIRONMENT.md`
  - `DECISIONS.md`
  - `CHANGELOG.md`
  - `KNOWN_ISSUES.md`
  - `AI_HANDOFF.md`
  - `PHASES/PHASE-00-FOUNDATION.md`

### Architecture Decisions Recorded
- ADR-001: Standalone application
- ADR-002: Dedicated Neon PostgreSQL 16
- ADR-003: Frozen dependency versions
- ADR-004: Auth.js v4 Credentials provider
- ADR-005: Standard Prisma connection (no adapter)
- ADR-006: Decimal for financial data
- ADR-007: RESTRICT onDelete for business records
- ADR-008: Non-unique email on PartnerApplication
- ADR-009: Concurrency-safe readable IDs
- ADR-010: Kickoff separated from project submission

### Known Issues Logged
- KI-001: DIRECT_URL using pooled connection string (low priority, functional)
- KI-002: SWC binary win32/x64 — Resolved by reinstall
