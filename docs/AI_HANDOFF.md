# AI Handoff Document — Cortex Partner Program

> **STOP. Read this entire document before touching any code.**
> Do NOT restart the project. Do NOT reinitialize. Do NOT reset the database. Do NOT upgrade dependencies.

---

## 1. Project State (as of 2026-09-01)

**Repository:** `c:\projects\cortex-partner` (local) / `https://github.com/g-softtech/cortex-partner`  
**Branch:** `main`  
**Latest commit:** `1737e68` — chore: set Vercel build command to run prisma migrate deploy before next build  

**Commit history (most recent 4):**
```
1737e68  chore: set Vercel build command to run prisma migrate deploy before next build
42e34a7  Fix: login callbackUrl redirect and Suspense boundary for useSearchParams
6dab5c6  Phase 16: Partner Program document and form integration
8e502b8  fix(download): proxy can now download ChangeRequestFile as well as ProjectFile
```

**Stack:** Next.js 14.2.15 · NextAuth 4.24.7 · Prisma 5.21.0 · PostgreSQL (Neon) · Vercel Blob · Resend

---

## 2. Production Deployment Status

**Production URL:** `https://partner.thecortexsystems.com`  
**Platform:** Vercel (connected to `g-softtech/cortex-partner` GitHub repo, auto-deploys on push to `main`)  
**Build command (now set):** `prisma migrate deploy && next build` (via `vercel.json`)  

**Deployment triggered:** Commit `1737e68` pushed 2026-09-01. Vercel deployment was in progress at handoff — **verify deployment completed successfully in Vercel dashboard before doing anything else.**

### Database Migration Status
- **Migration 1:** `20260826220002_init` — baseline schema — **applied** to production
- **Migration 2:** `20260831171732_add_partner_agreements_and_support_files` — adds `PartnerAgreementLog`, `SupportRequestFile`, optional `SupportRequest.projectId` — **should be applied by the `1737e68` deployment via `prisma migrate deploy`**

**VERIFY:** Log into Vercel, check the latest deployment build log. Confirm these lines appear:
```
prisma migrate deploy
20260826220002_init                                     — already applied
20260831171732_add_partner_agreements_and_support_files — applied
All migrations have been applied successfully.
```
If not, the login crash (Issue 1 below) is still active on production.

---

## 3. Completed Phases

Phases 0–16 are all complete. Do not redo any of them.

| Phase | Description | Status |
|---|---|---|
| 0 | Foundation, schema, migrations | ✅ |
| 1 | Public pages (/, /apply) | ✅ |
| 2 | Application system | ✅ |
| 3 | Admin application management | ✅ |
| 4 | Authentication (bcrypt, JWT, setup-account, middleware) | ✅ |
| 5 | Partner dashboard | ✅ |
| 6 | Project submission | ✅ |
| 7 | Admin project assessment | ✅ |
| 8 | Project kickoff | ✅ |
| 9 | Development workflow | ✅ |
| 10 | Change requests | ✅ |
| 11 | Notifications | ✅ |
| 12 | Support | ✅ |
| 13 | Resources (Partner Guide, Sales Kit, White-Label, FAQ) | ✅ |
| 14 | Security & hardening | ✅ |
| 15 | Blob storage migration (R2 → Vercel Blob) | ✅ |
| 16 | Document & form integration (Agreement, FAQ, Support files) | ✅ |

---

## 4. Current Known Issues (Discovered in Production Test — 2026-09-01)

These 5 issues were discovered during real end-to-end testing. They have been diagnosed but NOT yet implemented.

### Issue 1 — Login crash on production (CRITICAL — may already be fixed)
**Symptom:** "Application error: server-side exception" (Digest: 2583106258) when approved partner tries to log in.  
**Root cause:** `PartnerAgreementLog` table missing from production DB (migration not yet applied).  
**Fix deployed:** `vercel.json` with `prisma migrate deploy && next build` committed as `1737e68`. Should self-fix on next Vercel deploy.  
**Verify:** Check Vercel build log for migration success output.

### Issue 2 — Agreement does not gate project submission (SECURITY — NOT YET FIXED)
**Symptom:** Partner without a signed agreement can submit Project Opportunities.  
**Root cause:** `POST /api/projects` route calls `requirePartnerSession()` but does NOT check `PartnerAgreementLog`. No server-side gate exists. The dashboard shows a warning banner but does not prevent submission.  
**Required fix (server-side):** Inside `POST /api/projects`, after `requirePartnerSession()`, query `db.partnerAgreementLog.findFirst({ where: { partnerId: partner.id, version: CURRENT_AGREEMENT_VERSION } })`. If null, return `403: { error: "Partner Agreement must be accepted before submitting projects." }`.  
**File to modify:** `src/app/api/projects/route.ts`

### Issue 3 — Admin proposal not visible to Partner (WORKFLOW — NOT YET FIXED)
**Symptom:** Admin enters scope, partner price, estimated timeline in `AssessmentForm`. Partner cannot see these on `/projects/[id]`.  
**Root cause:** The Partner project detail page correctly shows proposal data **only when `projectStatus` is `PROPOSAL_SENT` or later** (see `PROPOSAL_VISIBLE_STATUSES`). However, the Admin `AssessmentForm` allows saving these fields at `UNDER_REVIEW` or `PRICED` status without also transitioning to `PROPOSAL_SENT`. If admin saves data but does NOT set status to `PROPOSAL_SENT`, the partner never sees it.  
**Root cause (secondary):** Admin may not understand that they must explicitly transition status to `PROPOSAL_SENT` to make the proposal visible. The `AssessmentForm` needs a clear call to action.  
**No data persistence bug** — data IS saved correctly to DB. The visibility gate is intentional but the workflow connection is not clear to admin.  
**Required fix:** In `AssessmentForm` or the admin project page, clearly label that selecting `PROPOSAL_SENT` as new status is what sends the proposal to the partner. The label "PROPOSAL_SENT" should say "Send Proposal to Partner".

### Issue 4 — No Admin → Partner response in Support (WORKFLOW — NOT YET FIXED)
**Symptom:** Admin can change support ticket status but cannot send a visible response/message to the Partner. Partner ticket detail page shows only the original submission with no response field.  
**Root cause:** `SupportRequest` schema has no `responseMessage` field. Admin support detail page (`/admin/support/[id]/page.tsx`) has only a status dropdown. Partner support detail page (`/support/[id]/page.tsx`) shows only the original description with no response.  
**Schema change required:** Add `adminResponse TEXT` (nullable) and `internalNote TEXT` (nullable, internal-only, never exposed to partner) to `SupportRequest`.  
**API change required:** `PATCH /api/admin/support/[id]` should accept `adminResponse` and `internalNote`.  
**UI changes required:** Admin support detail — add response textarea + internal note textarea. Partner support detail — show `adminResponse` (if non-null) as a "Cortex Response" block.  
**Security constraint:** `internalNote` must NEVER appear in partner-facing API responses or UI.

### Issue 5 — Partner profile is read-only with no account management (UX — NOT YET FIXED)
**Symptom:** `/profile` page exists but is entirely read-only. A note says "contact Cortex support to update details".  
**Current data shown:** Partner ID (immutable), Status, Full Name, Email, Partner Since, Application Number.  
**Required:** A self-service way to change display name and/or password at minimum.  
**Fields that should remain immutable:** `partnerId` (CP-XXXXX), `joinedAt`, `status` (only admin can change).  
**Fields the partner should be able to edit:** `name` (display name), password (via existing forgot-password flow or inline change).  
**Recommended:** Add a "Change Password" button that triggers the existing forgot-password email flow. Add an inline name-edit form (PATCH to a new `/api/partners/profile` route).

### Issue 6 — Notification dropdown overflow on mobile (UX — NOT YET FIXED)
**Symptom:** Notification text cut off on mobile viewports (320px–430px).  
**Root cause:** `NotificationDropdown.tsx` uses `w-80 sm:w-96` (320px/384px fixed width) positioned `right-0`. On narrow screens this overflows the left edge of the viewport. Inside items, `p className="text-sm text-slate-600"` has no `break-words` or `overflow-wrap`, and `flex items-start justify-between gap-2` with the "Mark read" button can push text off-screen.  
**File:** `src/components/ui/NotificationDropdown.tsx` line 93.  
**Fix:** Change `w-80 sm:w-96` to `w-screen max-w-sm` and add `right-0 left-auto` with `overflow-hidden` container. Add `break-words` to message text. Use `min-w-0 flex-1` on text container so flex doesn't overflow.

---

## 5. Authoritative Source Documents

These documents in `docs/partner-program/` are the approved source of truth for all business and legal content. Do NOT invent or paraphrase content — always read and copy from these.

| File | Purpose |
|---|---|
| `00-DOCUMENT-CONTROL.md` | Source document rules |
| `01-BUSINESS-MODEL.md` | Partner program business model |
| `02-PARTNER-PROGRAM-STRUCTURE.md` | Partner journey structure |
| `03-PARTNER-AGREEMENT-V1.0.md` | **Authoritative agreement text (v1.0)** |
| `04-PARTNER-GUIDE.md` | Partner Guide resource content |
| `05-PARTNER-APPLICATION.md` | Application form fields |
| `06-PROJECT-OPPORTUNITY-FORM.md` | Project submission fields |
| `07-PROJECT-ASSESSMENT.md` | Admin assessment fields |
| `08-PROJECT-KICKOFF-FORM.md` | Kickoff form fields |
| `09-CHANGE-REQUEST.md` | Change request fields |
| `10-DELIVERY-APPROVAL.md` | Delivery approval fields |
| `11-SUPPORT-REQUEST.md` | Support request fields |
| `12-PARTNER-SALES-KIT.md` | Sales Kit resource content |
| `13-WHITE-LABEL-GUIDELINES.md` | White-label guidelines content |
| `14-PARTNER-FAQ.md` | FAQ content |

---

## 6. Architecture Rules (DO NOT VIOLATE)

- **Storage:** Vercel Blob (`@vercel/blob`) only. Do NOT reintroduce S3/R2.
- **Database:** Prisma 5.21.0 with PostgreSQL (Neon). Always use `prisma migrate dev` → `prisma migrate deploy`. Never `prisma db push`. Never `prisma migrate reset` on production.
- **Agreement versioning:** `CURRENT_AGREEMENT_VERSION` in `src/lib/agreements/partner-agreement.ts` controls the active version. Agreement text for v1.0 is immutable.
- **IDOR:** All partner queries use explicit `where: { partnerId: partner.id }` — never return other partners' data.
- **Admin fields never exposed to partners:** `adminNotes`, `opportunityStatus`, `partnerPrice` (via explicit Prisma `select` — NOT spreading request bodies).
- **Support internal notes:** Any new `internalNote` field on SupportRequest must NEVER appear in partner-facing API responses.
- **Auth guard:** Every API route must call `requirePartnerSession()` or `requireAdminSession()` directly, independent of middleware.

---

## 7. What the Next Agent Must Do First

1. **Go to Vercel dashboard** → check the deployment for commit `1737e68`. Verify `prisma migrate deploy` ran successfully and both migrations show as applied.
2. **Confirm with the user** whether they want the 5 issues implemented and in what priority.
3. If proceeding: **Start with Issue 2** (Agreement gate on project submission) — it is a security issue and requires only a small server-side change to `src/app/api/projects/route.ts`.
4. For Issues 4 (Support responses) — this requires a new Prisma migration. Follow the existing migration strategy: `prisma migrate dev --name add_support_response` then commit the generated migration file.
5. Do NOT create a new phase or new architecture. Fix these issues in-place within the existing system.

---

## 8. Critical Rules

- Do NOT use `prisma db push` on production.
- Do NOT reset or drop the production database.
- Do NOT upgrade any dependency versions.
- Do NOT rebuild the platform.
- Do NOT introduce new frameworks.
- Do NOT invent business or legal content — read from `docs/partner-program/`.
- Do NOT change the `CURRENT_AGREEMENT_VERSION` until new agreement text is legally approved.
- Do NOT expose `internalNote`/`adminNotes` to partners.
- Do NOT create a new repository or change the remote.
