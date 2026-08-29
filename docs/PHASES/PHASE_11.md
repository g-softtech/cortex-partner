# Phase 11: Notifications

## Overview
Phase 11 implemented a centralized notification system for the Cortex Partner Program. It adds a reliable in-app database notification system mapped to all critical status transitions and provides an asynchronous, network-failure-resistant email dispatcher (powered by Resend).

## Implementation Details

### Centralized Service
- `src/lib/notifications.ts`: Added `notifyUser` and `notifyAdmins`. 
- **Resilience Strategy**: Database records are created *inside* the business transaction. Email dispatch is returned as a callback and executed *after* the transaction successfully commits.

### Workflows Hooked
- **Application Approval**: Admin approval emails the partner with their magic setup link.
- **Project Submission**: Admin is notified when a new project is submitted.
- **Project Assessment**: Partner is notified when their project is priced or reviewed.
- **Kickoff Submission**: Admin is notified when a kickoff is submitted.
- **Kickoff Review**: Partner is notified when a kickoff is approved or requires info.
- **Change Requests**: Admin is notified when submitted, partner is notified when reviewed.

### UI Integration
- Added `NotificationDropdown` (using `lucide-react`) to poll `/api/notifications`.
- Embedded into both `AdminNav` and `DashboardNav` headers.

## Security Considerations
- Email dispatch strictly suppresses errors so network issues with Resend do not roll back the database transaction.
- Admin-only fields (e.g. `adminNotes`, `opportunityStatus`, `partnerPrice` (in some states)) are explicitly omitted from email payloads to Partners.
- Setup token from Phase 4 is never persisted directly in the `Notification` record—it is only passed cleanly in the dispatched email.

## Verification
- Verified by programmatic testing in `scripts/test-phase11-notifications.ts` (using Prisma mocking for `notifyAdmins`).
