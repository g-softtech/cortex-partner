# Known Issues

## Open

### KI-003 — Login crash: PartnerAgreementLog table missing from production (2026-09-01)
**Status:** Fix deployed — pending verification  
**Symptom:** "Application error: server-side exception" (Digest 2583106258) when approved partner logs in.  
**Root cause:** Migration `20260831171732_add_partner_agreements_and_support_files` not applied to production DB.  
**Fix:** `vercel.json` added (commit `1737e68`) sets build command to `prisma migrate deploy && next build`. Migration should apply on next Vercel deploy.  
**Verify:** Check Vercel build log — look for "All migrations have been applied successfully."

### KI-004 — Agreement does not server-side gate project submission (2026-09-01)
**Status:** Open — not yet implemented  
**Symptom:** Partner without signed agreement can submit Project Opportunities via API.  
**Root cause:** `POST /api/projects` (`src/app/api/projects/route.ts`) does not check `PartnerAgreementLog`. Only a UI warning banner exists — no server enforcement.  
**Fix needed:** Add agreement check after `requirePartnerSession()` in `src/app/api/projects/route.ts`. Return 403 if not signed.

### KI-005 — Admin proposal not visible to Partner after assessment (2026-09-01)
**Status:** Open — workflow clarification + minor UI fix needed  
**Symptom:** Admin enters scope/price/timeline but Partner cannot see Cortex Proposal on project detail page.  
**Root cause:** Proposal is gated by `PROPOSAL_SENT` status (`PROPOSAL_VISIBLE_STATUSES` array in `/projects/[id]/page.tsx`). Admin must explicitly transition status to `PROPOSAL_SENT` — this step is not obvious in the current `AssessmentForm`.  
**Fix needed:** Relabel `PROPOSAL_SENT` option in AssessmentForm dropdown to "Send Proposal to Partner" to clarify intent.

### KI-006 — No Admin → Partner response mechanism in Support (2026-09-01)
**Status:** Open — requires schema migration + UI  
**Symptom:** Admin can change support ticket status but cannot send a visible response to Partner. Partner sees only their original description.  
**Root cause:** `SupportRequest` model has no `adminResponse` or `internalNote` field. Admin and Partner UIs have no response thread.  
**Fix needed:** Prisma migration to add `adminResponse TEXT?` and `internalNote TEXT?`. Update PATCH API and both UIs. `internalNote` must NEVER be exposed to partners.

### KI-007 — Partner profile is read-only (2026-09-01)
**Status:** Open — UX improvement  
**Symptom:** `/profile` page shows read-only fields with note to "contact Cortex support to update details."  
**Root cause:** No edit form or API endpoint for partner self-service profile updates.  
**Fix needed:** Add name edit form + Change Password flow on `/profile`. `partnerId`, `status`, `joinedAt` remain immutable.

### KI-008 — Notification dropdown overflows on mobile viewports (2026-09-01)
**Status:** Open — CSS fix only  
**Symptom:** Notifications cut off on 320px–430px viewports.  
**Root cause:** `NotificationDropdown.tsx` uses fixed `w-80 sm:w-96` width positioned `right-0`. Text lacks `break-words`. Flex layout with "Mark read" button can overflow on narrow screens.  
**File:** `src/components/ui/NotificationDropdown.tsx` line 93  
**Fix needed:** Use `w-screen max-w-sm` instead of `w-80`, add `min-w-0 flex-1` and `break-words` to content.

---

## Resolved

### KI-001 — DIRECT_URL using pooled connection string
**Status:** Resolved  
**Description:** The `.env` file originally used the same Neon pooled connection string for both `DATABASE_URL` and `DIRECT_URL`.  
**Resolution:** User manually updated `DIRECT_URL` to point to the direct/non-pooled endpoint for migration safety. Verified on 2026-08-26.

### KI-002 — Next.js SWC binary (win32/x64)
**Status:** Resolved  
**Description:** The SWC native binary `next-swc.win32-x64-msvc.node` failed to load with "not a valid Win32 application" error during `npm run build`.  
**Resolution:** Reinstalled `@next/swc-win32-x64-msvc` using `npm install @next/swc-win32-x64-msvc --force`.  
**Date:** 2026-08-26
