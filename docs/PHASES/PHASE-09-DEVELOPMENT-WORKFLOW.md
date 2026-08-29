# Phase 9: Development Workflow

## Objectives
- Allow Admins to manage the development lifecycle of a project.
- Implement server-side state machine for `ProjectStatus` transitions: `READY_FOR_DEVELOPMENT → DEVELOPMENT → INTERNAL_QA → PARTNER_REVIEW` and `FINAL_APPROVAL → DELIVERED`.
- Provide Partner UI for reviewing the project during `PARTNER_REVIEW` and `CUSTOMER_REVIEW`.
- Allow Partners to approve (moving state forward) or report an issue (moving state back to `CHANGES`).

## Implementation Details

### Database & State Transitions
- **Admin Workflow Transitions:** Atomic `PATCH /api/admin/projects/[id]/workflow` allows moving forward from `READY_FOR_DEVELOPMENT` all the way to `PARTNER_REVIEW` and from `FINAL_APPROVAL` to `DELIVERED`.
- **Partner Review Transitions:** Atomic `PATCH /api/projects/[id]/review` allows moving `PARTNER_REVIEW → CUSTOMER_REVIEW` and `CUSTOMER_REVIEW → FINAL_APPROVAL`. If an issue is reported, it moves the project to `CHANGES`.
- **Reporting Issues:** Instead of introducing a new database table, issue reports are safely logged inside `AuditLog.metadata.issueDescription` to keep the database schema frozen.

### Security
- **IDOR Protection:** `PATCH /api/projects/[id]/review` explicitly verifies that the `partnerId` matches the session.
- **Role Enforcement:** Admin workflow API enforces `requireAdminSession()`. Partner review API enforces `requirePartnerSession()`.
- **State Machine Rules:** Valid transitions are explicitly mapped on the server. If a request asks for a transition that is invalid based on the current state, it is rejected. Terminal states are enforced.
- **Optimistic Concurrency:** All transitions use `tx.project.updateMany({ where: { projectStatus: currentProject.projectStatus } })` to ensure no two actors can transition the project simultaneously causing a race condition.
- **Atomic Operations:** Audit logs and status changes are guaranteed to execute atomically within a Prisma `$transaction`.

### Tests
- Validated via `scripts/test-phase9-security.ts`.
- `npx prisma validate`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.
