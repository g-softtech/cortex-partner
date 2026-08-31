## [Unreleased]
- **Phase 16: Document & Form Integration**
  - **Database:** Migration `20260831171732_add_partner_agreements_and_support_files` applied. Added `PartnerAgreementLog`, `SupportRequestFile`, optional `projectId` on `SupportRequest`.
  - **Partner Agreement:** Immutable Version 1.0 text in `src/lib/agreements/partner-agreement.ts`. New `/onboarding/agreement` page with scrollable text and mandatory checkbox. New `POST/GET /api/partners/accept-agreement` endpoint. Acceptance recorded in `PartnerAgreementLog` and `AuditLog`.
  - **Dashboard:** Agreement banner (amber) shown when partner has not accepted current version. Contextual Next Action banner (blue) driven by project status — directs partner to their most urgent task.
  - **Support:** Enhanced `/support/new` with optional project selector and Vercel Blob screenshot/file attachment. New `POST /api/support/[id]/files` client-driven DB registration endpoint. Presign route extended for `uploadType: 'support'`. Download proxy extended to handle `SupportRequestFile` with IDOR checks.
  - **Resources:** New `/resources/faqs` page with 5 structured FAQ sections. FAQ tile added to `/resources` hub.
  - **Verification:** `prisma validate` ✅ · `tsc --noEmit` ✅ · `lint` ✅ · `build` ✅ · `test:unit 11/11` ✅

- **Phase 9: Development Workflow**
  - Implemented Admin API & UI for progressing projects through development states.
  - Implemented Partner API & UI for approving development stages and reporting issues.
  - Created server-side strict state transition machine mapping valid transitions.
  - Issue descriptions from Partners are securely embedded inside AuditLog metadata to avoid schema mutations.
  - Added strict programmatic security tests in `test-phase9-security.ts`.

- **Phase 8: Project Kickoff**
  - Added AWS SDK S3 clients for Cloudflare R2 file uploads/downloads
  - Built direct-to-S3 presigned URL generation with IDOR ownership validation
  - Implemented Atomic Proposal Acceptance (`PROPOSAL_SENT` → `WON` + `DRAFT` kickoff)
  - Created interactive Partner Kickoff form with auto-save and file uploads
  - Created Admin Review interface for project kickoffs
  - Extended static security tests in `test-phase8-security.ts`

- **Phase 7: Admin Project Assessment**
  - Added strict assessment API route (`PATCH /api/admin/projects/[id]/assess`)
  - Admin-only navigation additions for projects
  - Included a concurrency-safe Prisma state machine transition
  - Enforced Atomic AuditLog writes alongside project state updates
  - Implemented Client UI (`AssessmentForm.tsx` & `projects/[id]/page.tsx`)
  - Added strict programmatic security tests that verify partner API exclusion and terminal states

## [0.14.0] - 2026-08-29

### Security
- **Phase 14: Security & Hardening**
  - Added rigorous `checkRateLimit` enforcement to `/api/auth/setup-account`, `/api/files/presign`, and `/api/notifications`.
  - Hardened file upload security by strictly mapping allowed MIME types to safe file extensions on S3 upload keys, preventing `.exe` spoofing.
  - Added strict Next.js HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-DNS-Prefetch-Control`, `Referrer-Policy`, `Permissions-Policy`) to `next.config.mjs`.
  - Audited global authorization boundaries; verified `requirePartnerSession` and `requireAdminSession` strict enforcement across all dynamic routes.

## [0.13.0] - 2026-08-29

### Added
- **Phase 13: Resources**
  - Added Partner Resources hub (`/resources`).
  - Added Partner Guide static page (`/resources/partner-guide`).
  - Added Sales Kit static page (`/resources/sales-kit`).
  - Added White-label Guidelines static page (`/resources/white-label`).

## [0.12.0] - 2026-08-29

### Added
- **Phase 12: Support**
  - Implemented partner support request submission system (`/support`, `/support/new`).
  - Implemented admin support management system (`/admin/support`, `/admin/support/[id]`).
  - Centralized robust sequence ID generation for support tickets (`SUP-XXXXX`).
  - Added email and in-app notifications for support ticket creation and status updates.

## [0.1.0] - 2026-08-27
- **Phase 6: Project Submission**
  - Added `projectSubmissionSchema` validation
  - Added rate limiting
  - Added sequence-based atomic `CPJ-XXXXX` project number generation
  - Built secure API route returning minimal navigation IDs

- **Phase 5: Partner Dashboard**
  - Built Partner UI components (`/dashboard`, `/projects`, `/projects/[id]`, `/profile`)
  - Enforced `requirePartnerSession()`
  - Explicit Prisma queries omitting admin/pricing data from partners

- **Phase 0–4: Architecture & Auth**
  - Project initialized
  - NextAuth setup
  - Partner application workflow
 
- **Phase 11: Notifications**
  - Implemented centralized notification dispatcher (`notifyUser` and `notifyAdmins`).
  - Integrated `resend` for transactional email delivery.
  - Linked database notification records securely to transactional state transitions.
  - Created interactive Notification Dropdown UI for Dashboard and Admin navigation.
  - Added test suite to ensure notification parameters remain decoupled from Prisma payloads.

- **Phase 10: Change Requests**
  - Implemented full Change Request functionality for DELIVERED and SUPPORT projects.
  - Updated `/api/files/presign` to validate `ChangeRequest -> Project -> Partner` relationships.
  - Created `/api/projects/[id]/changes` and `/api/projects/[id]/changes/[changeId]/files` for partner requests.
  - Created Admin panel for reviewing change requests and updating status.
  - Comprehensive security suite validating state transitions and relational ownership.