# Phase 12: Support

## Overview
Phase 12 implemented the Support Request system for the Cortex Partner Program. It allows partners to submit and track support tickets directly from their dashboard, and gives admins a central view to manage and update support requests across all partners.

## Key Features
1. **Partner Support Portal**:
   - `/support` — A list view of all support requests submitted by the partner.
   - `/support/new` — A form for partners to submit a new support request with categories and subject.
   - `/support/[id]` — A detail view of a specific support request and its status.

2. **Admin Support Management**:
   - `/admin/support` — An admin list view of all support requests across the platform.
   - `/admin/support/[id]` — An admin interface to update support request statuses (e.g., OPEN, IN_PROGRESS, RESOLVED).

3. **Backend Systems**:
   - Secure generation of support request IDs (`SUP-XXXXX`) using Prisma's `db.$transaction` to guarantee collision-free sequence numbers.
   - In-app and email notifications dispatched reliably upon support request creation and status updates.
   - Complete authorization checks ensuring partners can only access their own support requests.

## Security Controls
- **IDOR Prevention**: The Partner support API (`GET /api/support`) securely derives the `partnerId` from the server-side session (`requirePartnerSession`). The Admin API (`GET /api/admin/support`) requires strict `ADMIN` role checks.
- **Rate Limiting**: `POST /api/support` is rate-limited (5 requests per 5 minutes) to prevent spam.
- **Data Validation**: Using `zod` schemas (`supportSubmissionSchema` and `adminSupportUpdateSchema`) to ensure valid data is persisted.

## Verification
Phase 12 components successfully compiled with `npx tsc --noEmit` and passed standard lint and build tests. All requirements outlined in the `ROADMAP.md` for this phase have been successfully implemented.
