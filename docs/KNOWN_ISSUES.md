# Known Issues

## Open

### KI-003 — Login crash: PartnerAgreementLog table missing from production (2026-09-01)
**Status:** Fix deployed — pending verification  
**Symptom:** "Application error: server-side exception" (Digest 2583106258) when approved partner logs in.  
**Root cause:** Migration `20260831171732_add_partner_agreements_and_support_files` not applied to production DB.  
**Fix:** `vercel.json` added (commit `1737e68`) sets build command to `prisma migrate deploy && next build`. Migration should apply on next Vercel deploy.  
**Verify:** Check Vercel build log — look for "All migrations have been applied successfully."

## Resolved

### KI-004 — Agreement does not server-side gate project submission (2026-09-01)
**Status:** Resolved  
**Description:** Partner without signed agreement could submit Project Opportunities via API.  
**Resolution:** Added `db.partnerAgreementLog.findFirst` check inside `POST /api/projects`.

### KI-005 — Admin proposal not visible to Partner after assessment (2026-09-01)
**Status:** Resolved  
**Description:** Admin entered scope/price/timeline but Partner could not see Cortex Proposal on project detail page due to confusing workflow.  
**Resolution:** Relabeled `PROPOSAL_SENT` option in AssessmentForm dropdown to "Send Proposal to Partner" to clarify intent.

### KI-006 — No Admin → Partner response mechanism in Support (2026-09-01)
**Status:** Resolved  
**Description:** Admin could change support ticket status but could not send a visible response to Partner.  
**Resolution:** Added `adminResponse` and `internalNote` to `SupportRequest` schema. Created migration, updated `PATCH` API, updated Admin UI with textareas, and Partner UI to display `adminResponse`.

### KI-007 — Partner profile is read-only (2026-09-01)
**Status:** Resolved  
**Description:** `/profile` page showed read-only fields.  
**Resolution:** Added `ProfileEditForm` client component for inline name editing and a link to the `/forgot-password` flow.

### KI-008 — Notification dropdown overflows on mobile viewports (2026-09-01)
**Status:** Resolved  
**Description:** Notifications cut off on 320px–430px viewports.  
**Resolution:** Made dropdown container responsive (`w-[calc(100vw-2rem)] max-w-sm sm:w-96`) and added `min-w-0 flex-1 break-words` to text content.

### KI-001 — DIRECT_URL using pooled connection string
**Status:** Resolved  
**Description:** The `.env` file originally used the same Neon pooled connection string for both `DATABASE_URL` and `DIRECT_URL`.  
**Resolution:** User manually updated `DIRECT_URL` to point to the direct/non-pooled endpoint for migration safety. Verified on 2026-08-26.

### KI-002 — Next.js SWC binary (win32/x64)
**Status:** Resolved  
**Description:** The SWC native binary `next-swc.win32-x64-msvc.node` failed to load with "not a valid Win32 application" error during `npm run build`.  
**Resolution:** Reinstalled `@next/swc-win32-x64-msvc` using `npm install @next/swc-win32-x64-msvc --force`.  
**Date:** 2026-08-26
