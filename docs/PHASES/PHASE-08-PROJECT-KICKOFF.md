# Phase 8: Project Kickoff

## Objectives
- Allow Partners to accept a proposal (status: `PROPOSAL_SENT` → `WON`).
- Present a kickoff form for the partner to provide deep project details and files.
- Enable direct-to-Cloudflare-R2 secure file uploads via presigned URLs.
- Allow Admin to review and approve kickoff details.

## Implementation Details

### Database & State Transitions
- **Accept Proposal:** Atomic `PATCH /api/projects/[id]/accept` transitions `Project` status to `WON` and creates a `ProjectKickoff` with status `DRAFT`. Writes AuditLog.
- **Kickoff Form Data:** Zod-validated Kickoff schema for auto-saving drafts (partial data) and full submission (`KICKOFF_SUBMITTED`).
- **File Management:** Files are tracked in `ProjectFile`. Real files are in Cloudflare R2 bucket.
- **Admin Review:** Admin `PATCH /api/admin/projects/[id]/kickoff/review` can transition `ProjectKickoff` from `SUBMITTED` to `APPROVED` or `INFORMATION_REQUIRED`.

### R2 Storage Integration
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` added for Cloudflare R2 compatibility.
- `src/lib/storage/s3.ts` initializes S3 client.
- `POST /api/files/presign` gives a short-lived PUT URL for browser uploads.
- `GET /api/files/download/[id]` gives a short-lived GET URL for browser downloads.
- IDOR checked: partner ID matches file ownership before issuing URLs.
- *Manual Configuration Needed:* The R2 bucket requires real credentials in `.env` and manual CORS configuration to allow `PUT`/`GET` from `http://localhost:3000` (or prod URL).

### Security
- **IDOR Protection:** All routes check `requirePartnerSession()` and verify ownership before returning or modifying kickoff data.
- **Visibility Gates:** Proposal fields (`partnerPrice`, `scope`, `estimatedTimeline`) only become visible on Partner Project page once status is `>= PROPOSAL_SENT`.
- **Admin Isolation:** Admin-only fields (`adminNotes`, `opportunityStatus`) strictly excluded from Partner UI.
- **Atomic Operations:** Accept Proposal and Kickoff Submission employ Prisma `$transaction` to atomically transition `Project` and `ProjectKickoff` statuses and write `AuditLog`s. Concurrency checks used via `updateMany` criteria.

### Tests
- Validated via `scripts/test-phase8-security.ts`.
- `npx prisma validate`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
