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

**Current Phase:** Phase 13 - Resources (Next)
**Last Completed:** Phase 12 - Support
**Date:** 2026-08-29

**COMPLETED:** Phase 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, and 12.

---

## What Was Just Completed

**Phase 11: Notifications**
Implemented a centralized notification system (`notifyUser` and `notifyAdmins`) providing both in-app records and robust asynchronous Resend email dispatches. Notification records are committed alongside database transitions, and emails are fired safely afterwards to avoid reverting business logic on network failures. Added `NotificationDropdown` to admin and partner navigations.

---

## Architecture Context

*   **Framework:** Next.js 14 App Router.
*   **Database:** PostgreSQL via Prisma.
*   **Storage:** Cloudflare R2 (S3 compatible) for `ProjectFile`s and `ChangeRequestFile`s.
*   **Authentication:** NextAuth (Google Provider).
*   **Schema:** The Prisma schema is **FROZEN**. New data requirements must fit into existing JSON fields or `AuditLog.metadata`.
*   **Security:** Enforced via `requirePartnerSession` and `requireAdminSession`. Partner endpoints strictly validate `partnerId` matching the authenticated session. Change Request attachments validate `ChangeRequest -> Project -> Partner -> User` ownership.

### Next Steps (Phase 12: Support)
1.  Read `docs/ROADMAP.md` to see Phase 12 goals.
2.  Review `docs/PHASES/PHASE_11.md` for context on the recently completed phase.
3.  Do not attempt to rewrite or refactor completed phases unless specifically requested by the user.
