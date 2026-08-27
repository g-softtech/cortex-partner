# Cortex Partner Program — AI Handoff

## ⚠️ READ THIS FIRST

This project is **already under development**. Do NOT restart it.

Do NOT:
- Redo Phase 0 or Phase 1.
- Reinitialize the repository
- Recreate `package.json`
- Reset the database
- Delete migrations
- Replace working architecture
- Start from Phase 1
- Install a new dependency simply because it is the latest version. Any new dependency must go through the existing stability/compatibility check.

Instead: **READ → VERIFY → CONTINUE**
Read the continuity documentation and verify the actual repository state before making changes.

---

## Current State
**COMPLETED:** Phase 0, 1, 2, 3, 4, 5, 6, and 7.
**NEXT TASK:** Phase 8 — Project Kickoff (See `docs/ROADMAP.md`)

---

## Current Status

Phase 6 is complete. Partners can now securely submit new project requirements (`/projects/new`), which are stored with safe, atomic server-generated project numbers (`CPJ-XXXXX`) and heavily enforced server-side ownership.

Ready to build Phase 7 — Admin Dashboard & Architecture.

---

## What Has Been Completed

### Phase 0 — COMPLETE

- Repository initialized with `create-next-app@14.2.15`
- Stable dependency stack frozen and pinned (see ARCHITECTURE.md)
- `package-lock.json` generated and committed
- `.nvmrc` → Node `22.16.0`
- `package.json` engines → Node `22.16.0`
- `.env.example` → placeholders only
- `.gitignore` → `.env` excluded from Git
- `prisma/schema.prisma` → full approved schema with all models, enums, FK constraints
- Schema validated (`npx prisma validate` ✅)
- Migration `20260826220002_init` applied to Neon dev database (`cortex_partner_dev`)
- Prisma Client v5.21.0 generated
- All docs/ continuity files created and populated

### Phase 1 — COMPLETE

- `src/lib/db/index.ts` (Prisma Client singleton)
- `src/lib/validations/partner.ts` (Zod schema for applications)
- `src/lib/services/rate-limit.ts` (In-memory abuse protection)
- `src/app/api/partners/apply/route.ts` (Application creation with atomic Sequence increment)
- `/` (Landing page)
- `/apply` (Application form)
- `/application-success` (Success page)

### Phase 4 — COMPLETE

- `src/lib/auth/options.ts` — real bcrypt password verification via DB lookup
- `src/app/api/auth/setup-account/route.ts` — token validation + atomic password-set endpoint
- `src/app/(public)/login/page.tsx` + `LoginForm.tsx` — real credentials login form with role-aware redirect
- `src/app/(public)/setup-account/page.tsx` + `SetupForm.tsx` — account setup UI consuming the setup token
- `scripts/bootstrap-admin.ts` — interactive admin bootstrap script (hidden password prompt, no shell history exposure)
- Installed `bcryptjs@2.4.3` + `@types/bcryptjs@2.4.6`
- Middleware (`src/middleware.ts`) already in place protecting `/admin` (ADMIN only) and `/dashboard`

### Phase 5 — COMPLETE

- `src/lib/auth/session.ts` — added `requirePartnerSession()` to verify Partner existence and role
- `src/middleware.ts` — explicitly enforced `UserRole.PARTNER` on `/dashboard`, `/projects`, `/profile`
- `src/app/(dashboard)/layout.tsx` — responsive sidebar layout for Partners
- `/dashboard` — welcome, key statistics, recent projects
- `/projects` — partner project listing
- `/projects/[id]` — project detail with strict IDOR checking and Prisma `select` restrictions (no `adminNotes` or `opportunityStatus`)
- `/profile` — read-only partner information display

### Phase 6 — COMPLETE

- `src/lib/validations/project.ts` — `projectSubmissionSchema` implemented.
- `src/app/api/projects/route.ts` — strict project submission API. Uses atomic sequence incrementing for `CPJ-XXXXX`, enforces partner ID from session, uses `checkRateLimit`, and filters returned fields.
- `src/app/(dashboard)/projects/new/page.tsx` — integrated form using `react-hook-form` and custom `zodResolver`.
- Added "Submit New Project" CTAs to `/dashboard` and `/projects`.

---

## What Was Just Completed

Phase 6 Project Submission — partners can successfully and securely submit new projects. API securely derives identity from the session and rejects mass assignments.

---

## Exact Next Task

**Build Phase 7 — Admin Dashboard & Architecture:**

1. Create `(admin)` route group with an admin-specific layout.
2. Build `/admin` dashboard overview (stats for total projects, total partners).
3. Build `/admin/projects` to list all submitted projects.

---

## Files Recently Modified

- `src/lib/auth/options.ts`
- `src/app/api/auth/setup-account/route.ts`
- `src/app/(public)/login/page.tsx`
- `src/app/(public)/login/LoginForm.tsx`
- `src/app/(public)/setup-account/page.tsx`
- `src/app/(public)/setup-account/SetupForm.tsx`
- `scripts/bootstrap-admin.ts`
- `scripts/test-token-flow.ts`
- `scripts/verify-db.ts`
- `docs/PROJECT_STATUS.md`
- `docs/CHANGELOG.md`
- `docs/AI_HANDOFF.md`
- `docs/ROADMAP.md`

---

## Database Changes

- (No schema changes. Migrations up-to-date)

---

## Known Issues

*(None currently open)*

### KI-002 — Next.js SWC binary (resolved)
- The SWC native binary for win32/x64 failed to load initially.
- Resolved by reinstalling `@next/swc-win32-x64-msvc` with `--force`.

---

## Tests Passed

- `npx prisma validate` ✅
- `npx tsc --noEmit` ✅
- `npm run lint` ✅
- `npm run build` ✅

## Tests Not Yet Run

- (All foundation tests have been successfully run)

---

## Things NOT To Change

- The frozen dependency versions in `package.json`
- The Prisma schema (unless a new migration is needed)
- The migration `20260826220002_init` (already applied to live database)
- The database connection strategy (standard Prisma TCP, no adapters)
- The docs/ continuity system structure

---

## Important Decisions

1. **Standard Prisma connection** — No `@prisma/adapter-neon`. Standard TCP is simpler and safer for Node.js Serverless.
2. **Credentials provider** — Not Magic Link. Partners set their own password via setup token.
3. **No `@unique` on `PartnerApplication.email`** — allows reapplication after decline.
4. **`RESTRICT` onDelete** — business records are preserved, not deleted.
5. **`DECIMAL(12,2)` for partnerPrice** — never Float for financial data.

---

## Recommended Next Action

Begin Phase 4: Authentication. 

---

## SESSION END SUMMARY

**Session:** Phase 6 Project Submission — Complete
**Completed:** `projectSubmissionSchema`, UI form with RHF, strict `POST /api/projects` route enforcing session partner mapping, atomic CPJ ID generation.
**Current state:** Phase 6 complete. Ready for Phase 7.
**Next exact action:** Build Phase 7: Admin layout and basic admin projects overview.
**Files changed:** `route.ts`, `page.tsx`, `project.ts`, `docs/`.
**Tests passed:** `prisma validate`, `tsc --noEmit`, `lint`, `build`, programmatic security test preventing mass assignment and IDOR on POST.
**Known issues:** None open.
