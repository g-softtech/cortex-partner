# Cortex Partner Program — AI Handoff

## ⚠️ READ THIS FIRST

This project is **already under development**. Do NOT restart it.

**FIRST read and understand `docs/ROADMAP.md` as the master project plan.** Then read `docs/ARCHITECTURE.md`, `docs/AI_HANDOFF.md`, `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md`, and `docs/KNOWN_ISSUES.md`. These documents together define the project context. Do not begin implementation until you have inspected them and verified the actual repository state. Phases 0–8 are already complete; continue from the next phase documented in the master roadmap.

Do NOT:
- Redo Phase 0 to Phase 8.
- Reinitialize the repository
- Recreate `package.json`
- Reset the database
- Delete migrations
- Replace working architecture
- Install a new dependency simply because it is the latest version. Any new dependency must go through the existing stability/compatibility check.

---

## Current State
**COMPLETED:** Phase 0, 1, 2, 3, 4, 5, 6, 7, and 8.
**NEXT TASK:** Phase 9 — Development Workflow (See `docs/ROADMAP.md`)

---

## What Was Just Completed

**Phase 8: Project Kickoff**
Partners can now accept project proposals, which atomically updates the project state to `WON` and creates a kickoff draft. Partners can fill out the interactive kickoff form and upload files securely to Cloudflare R2 via presigned URLs. Admins can review and approve kickoffs, transitioning the project to `READY_FOR_DEVELOPMENT`.

---

## Exact Next Task

**Build Phase 9 — Development Workflow:**
1. Track project through the development lifecycle.
2. Implement status transitions: `READY_FOR_DEVELOPMENT → DEVELOPMENT → INTERNAL_QA → PARTNER_REVIEW`.
3. Implement partner review flow (approve or report issue).
4. Implement final transitions: `CUSTOMER_REVIEW → FINAL_APPROVAL → DELIVERED`.

---

## Things NOT To Change

- The frozen dependency versions in `package.json`
- The Prisma schema (unless a new migration is needed for Phase 9)
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

## Tests Passed
- `npx prisma validate` ✅
- `npx tsc --noEmit` ✅
- `npm run lint` ✅
- `npm run build` ✅
- `npx tsx scripts/test-phase8-security.ts` ✅

---

## SESSION END SUMMARY

**Session:** Phase 8 Project Kickoff — Complete
**Completed:** S3 client config, Presigned Upload/Download routes, Atomic Proposal Acceptance, Partner Kickoff Form with file uploads, Admin Kickoff Review.
**Current state:** Phase 8 complete. Ready for Phase 9.
**Next exact action:** Begin Phase 9: Development Workflow.
**Tests passed:** All verification and security tests passed.
**Known issues:** None open.
