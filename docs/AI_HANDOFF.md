# AI Handoff Document

This project is **already under development**. Do NOT restart it.

**FIRST read and understand `docs/ROADMAP.md` as the master project plan.** Then read `docs/ARCHITECTURE.md`, `docs/AI_HANDOFF.md`, `docs/PROJECT_STATUS.md`, `docs/DECISIONS.md`, and `docs/KNOWN_ISSUES.md`. These documents together define the project context. Do not begin implementation until you have inspected them and verified the actual repository state. Phases 0–10 are already complete; continue from the next phase documented in the master roadmap.

Do NOT:
- Redo Phase 0 to Phase 10.
- Reinitialize the repository
- Recreate `package.json`
- Reset the database
- Delete migrations
- Replace working architecture
- Install a new dependency simply because it is the latest version. Any new dependency must go through the existing stability/compatibility check.

---

## Status Overview

**Current Phase:** Phase 16 - Document & Form Integration ✅ COMPLETE
**Last Completed:** Phase 16 - Document & Form Integration
**Date:** 2026-08-31

**COMPLETED:** Phase 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, and 15.

---

## What Was Just Completed

**Phase 16: Document & Form Integration — Stage 1/6: Database Schema**

Migration `20260831171732_add_partner_agreements_and_support_files` applied successfully.

Changes:
- Added `PartnerAgreementLog` model — tracks Partner acceptance of versioned legal agreements (version string, acceptedAt, ipAddress). Historical records are permanent; new versions do not overwrite old ones.
- Added `SupportRequestFile` model — Vercel Blob attachments for support tickets.
- Added optional `projectId` to `SupportRequest` — partners can now link a support ticket to a specific project.
- Added `SupportRequestFile[]` relation to `User` and `SupportRequest`.
- Added `PartnerAgreementLog[]` relation to `Partner`.
- Added `SupportRequest[]` relation to `Project`.

**Architecture Context (corrected):**
- Storage has been migrated from Cloudflare R2 → **Vercel Blob** (`@vercel/blob`). Do NOT reintroduce Cloudflare/S3.
- The Prisma schema is now **live** (not frozen) with the additive migration above.

---

## Stage 2/6: COMPLETE — Support File Storage
## Stage 3/6: COMPLETE — Partner Agreement Onboarding
## Stage 4/6: COMPLETE — Dashboard Contextual Actions
## Stage 5/6: COMPLETE — FAQ Resource
## Stage 6/6: IN PROGRESS — Test Suite

### New Files Created
- `src/lib/agreements/partner-agreement.ts` — Versioned agreement text (v1.0 immutable)
- `src/app/(dashboard)/onboarding/agreement/page.tsx` — Agreement server page
- `src/app/(dashboard)/onboarding/agreement/AgreementAcceptForm.tsx` — Agreement client form
- `src/app/api/partners/accept-agreement/route.ts` — Agreement acceptance API
- `src/app/(dashboard)/support/new/NewSupportForm.tsx` — Enhanced support form (project selector + file upload)
- `src/app/api/support/[id]/files/route.ts` — Support file registration endpoint
- `src/app/(dashboard)/resources/faqs/page.tsx` — FAQ resource page

### Modified Files
- `prisma/schema.prisma` — Added `PartnerAgreementLog`, `SupportRequestFile`, `SupportRequest.projectId`
- `src/app/api/files/presign/route.ts` — Extended for `uploadType: 'support'`
- `src/app/api/files/download/[id]/route.ts` — Extended for `SupportRequestFile` with IDOR checks
- `src/app/(dashboard)/dashboard/page.tsx` — Agreement + contextual action banners
- `src/app/(dashboard)/resources/page.tsx` — FAQ tile added
- `src/app/api/support/route.ts` — Persists optional `projectId`
- `src/lib/validations/support.ts` — Added optional `projectId` field

### Verification
- `prisma migrate dev` ✅ (public schema)
- `prisma migrate deploy` ✅ (test_suite schema baselined + migrated)
- `tsc --noEmit` ✅
- `lint` ✅
- `build` ✅ (37 pages)
- `test:unit` ✅ (11/11)
- `test:e2e` ✅ (8/8)

### Next Steps for Production
1. Deploy to Vercel — `prisma migrate deploy` runs automatically and will apply the new migration to production.
2. Get legal sign-off on Partner Agreement Version 1.0 text before enforcing for live partners.
3. The agreement version `CURRENT_AGREEMENT_VERSION` in `src/lib/agreements/partner-agreement.ts` controls which version is presented. Update it when a new version is ready.

### Critical Rules
- Do NOT use `prisma db push` in production.
- Do NOT reset, drop, or recreate the production database.
- Do NOT upgrade dependencies.
- `prisma migrate deploy` runs automatically on Vercel deploy.
