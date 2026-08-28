## [Unreleased]
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
