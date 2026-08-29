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
**COMPLETED:** Phase 0, 1, 2, 3, 4, 5, 6, 7, 8, and 9.
**NEXT TASK:** Phase 10 — Change Requests (See `docs/ROADMAP.md`)

---

## What Was Just Completed

**Phase 9: Development Workflow**
Admins can now transition project states through the development lifecycle (`READY_FOR_DEVELOPMENT → DEVELOPMENT → INTERNAL_QA → PARTNER_REVIEW` and `FINAL_APPROVAL → DELIVERED`). Partners can review projects and either approve them (moving state forward) or report issues (moving state back to `CHANGES` and logging issue in AuditLog).

---

## Exact Next Task

**Build Phase 10 — Change Requests:**
1. Allow partners to submit change requests post-delivery.
2. Build `/projects/[id]/changes` for submitting change requests.
3. Allow file attachments on change requests.
4. Admin handlers for scoping change requests (e.g. IN_SCOPE, ADDITIONAL_WORK).

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
- `npx tsx scripts/test-phase9-security.ts` ✅

---

## SESSION END SUMMARY

**Session:** Phase 9 Development Workflow — Complete
**Completed:** Admin workflow transitions, Partner review/approval transitions, robust server-side state machine enforcement, issue descriptions logged to Audit metadata.
**Current state:** Phase 9 complete. Ready for Phase 10.
**Next exact action:** Begin Phase 10: Change Requests.
**Tests passed:** All verification and security tests passed.
**Known issues:** None open.
