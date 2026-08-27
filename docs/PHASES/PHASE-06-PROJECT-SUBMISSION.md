# Phase 6: Project Submission

## Objective
Enable authenticated partners to securely submit new project requirements for Cortex to review and estimate.

## Changes Implemented

1. **Validation Schema (`src/lib/validations/project.ts`)**
   - Added `projectSubmissionSchema` to securely validate incoming project details.
   - Requires `projectType`, `description`, and `features`. 
   - Accepts optional `budget` and `timeline`.

2. **Project API Route (`src/app/api/projects/route.ts`)**
   - **Authorization:** Enforces `requirePartnerSession()` to verify `UserRole.PARTNER`.
   - **Rate Limiting:** Protects the endpoint with `checkRateLimit()` to prevent spam.
   - **Atomic Sequence:** Uses a Prisma transaction to safely increment the `Sequence` table and generate unique `CPJ-XXXXX` project numbers.
   - **Data Restrictions:** Exclusively assigns `partnerId` from the verified session (ignoring client inputs). Explicitly prunes response data to only return `projectId` and `projectNumber` for navigation.
   - **State Machine:** Initializes new projects with `projectStatus = SUBMITTED` and `opportunityStatus = UNKNOWN`.

3. **Project Submission UI (`src/app/(dashboard)/projects/new/page.tsx`)**
   - Implemented a secure form using `react-hook-form` and the custom `zodResolver`.
   - Captures all required fields.
   - Safely redirects to the `/projects/[id]` detail view upon successful submission using the verified database `id` returned from the API.

4. **Dashboard CTAs**
   - Added "Submit New Project" calls to action on `/dashboard` and `/projects` (including empty states).

## Tests Passed
- `npx prisma validate`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- Custom programmatic security test (`test-phase6-security.ts`) verifying:
  - No mass assignment is used in the API route.
  - Ownership IDOR checks.
  - Atomic sequence format generation.
  - Absence of internal fields in API response.

## Dependencies Added
- None. Used existing Tailwind and React components.
