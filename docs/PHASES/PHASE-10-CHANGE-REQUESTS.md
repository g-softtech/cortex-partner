# Phase 10: Change Requests

**Status:** Completed
**Date:** 2026-08-29

## Overview
Implemented the Change Request workflow, allowing partners to submit and manage change requests for projects in `DELIVERED` or `SUPPORT` states. This feature ensures any post-delivery modifications are properly tracked and authorized.

## Key Features Implemented

1. **Strict Relational Validation for File Uploads:**
   - Updated `/api/files/presign` to optionally accept `changeRequestId`.
   - Before issuing a presigned URL, the server verifies `ChangeRequest → Project → Partner → authenticated User`.

2. **Partner Capabilities:**
   - View a list of Change Requests associated with a project.
   - Submit new Change Requests (requires project to be in `DELIVERED` or `SUPPORT`).
   - Upload file attachments specifically linked to a Change Request.
   
3. **Admin Capabilities:**
   - View Change Requests in the Admin Project Detail panel.
   - Update Change Request status (e.g., `SUBMITTED` → `PRICED` or `APPROVED`).
   - Add an explanation to the Change Request (e.g., outlining why something is out-of-scope or clarifying the requested changes).

4. **Security & Auditing:**
   - Adhered to the schema freeze: NO schema modifications were made.
   - All state transitions and updates to Change Requests are logged via `AuditLog`.
   - Comprehensive security test script (`scripts/test-phase10-security.ts`) verifying that cross-partner access, unauthorized modifications, and incorrect project states are strictly denied.

## Technical Details

- **Database:** Used existing `ChangeRequest` and `ChangeRequestFile` models.
- **File Uploads:** Integrated a multi-step upload flow using Cloudflare R2 presigned URLs.
- **Audit Logging:** Handled via database transactions to ensure consistency.

## Next Phase
Proceed to Phase 11: Production Deployment Readiness.
