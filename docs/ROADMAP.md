# Cortex Partner Program — Roadmap

## Overview

The Cortex Partner Program is built in incremental phases. Each phase must be verified before the next begins.

---

## PHASE 0 — FOUNDATION ✅ COMPLETE

**Objective:** Establish the repository, stable dependencies, database schema, and documentation system.

### Tasks
- [x] Project architecture reviewed and approved (3 revision cycles)
- [x] Stability and Version Compatibility policy agreed
- [x] AI Handoff documentation system established
- [x] `/docs` directory and all continuity files created
- [x] Compatibility matrix verified and frozen
- [x] Repository initialized (`create-next-app@14.2.15`)
- [x] Exact pinned versions installed (`package.json`)
- [x] `package-lock.json` generated and retained
- [x] `.nvmrc` created (`22.16.0`)
- [x] `package.json` engines configured
- [x] `.env.example` created with placeholders only
- [x] `.gitignore` updated — `.env` secrets excluded from Git
- [x] `prisma/schema.prisma` created with full approved schema
- [x] Schema validated (`prisma validate` ✅)
- [x] Migration `20260826220002_init` applied to `cortex_partner_dev`
- [x] Prisma Client v5.21.0 generated
- [x] Build verification
- [x] Documentation checkpoint

### Dependencies
- None (first phase)

### Completion Criteria
- Repository initialized ✅
- Prisma schema validated ✅
- Migration applied to dev database ✅
- Prisma Client generated ✅
- Build passes ✅
- All documentation updated ✅

---

## PHASE 1 — PUBLIC PARTNER PROGRAM ✅ COMPLETE

**Objective:** Build the public-facing pages that the world sees.

### Tasks
- [x] Landing page (`/`) — professional, persuasive
- [x] Partner Application form (`/apply`)
- [x] Application success page (`/application-success`)

### Dependencies
- Phase 0 complete

### Completion Criteria
- Pages render correctly on mobile and desktop
- Application form submits to the API and stores in the database
- Success page shown after submission
- TypeScript passes
- Build passes

---

## PHASE 2 — APPLICATION SYSTEM ✅ COMPLETE

**Objective:** Handle partner applications in the database with full validation.

### Tasks
- [x] `PartnerApplication` API route (`POST /api/partners/apply`)
- [x] Server-side Zod validation
- [x] Spam/duplicate protection
- [x] Concurrency-safe `applicationNumber` generation (`CPA-XXXXX`)
- [x] Store application in Neon database

### Dependencies
- Phase 1 complete

---

## PHASE 3 — ADMIN APPLICATION MANAGEMENT ✅ COMPLETE

**Objective:** Admin can view, approve, decline, and request information from applicants.

### Tasks
- [x] Admin authentication guard
- [x] `/admin/partner-applications` — list view
- [x] `/admin/partner-applications/[id]` — detail view
- [x] Approve action → creates Partner + User + AccountSetupToken
- [x] Decline action
- [x] Request More Information action
- [ ] Sends email notification on approval/decline (Moved to Phase 11 / 4)

### Dependencies
- Phase 2 complete

---

## PHASE 4 — AUTHENTICATION ✅ COMPLETE

**Objective:** Secure login, account setup, and role-based access.

### Tasks
- [x] Auth.js v4 Credentials provider configuration
- [x] `/login` page
- [x] Account setup flow (`/setup-account?token=xxx`)
- [x] bcrypt password hashing (`bcryptjs@2.4.3`)
- [x] JWT session configuration (id + role in token)
- [x] Middleware protecting `/dashboard` and `/admin`
- [x] Admin bootstrap script (no public `/admin/register`)
- [x] Role enforcement (ADMIN vs PARTNER)
- [ ] Password reset (future — deferred)

### Dependencies
- Phase 3 complete

---

## PHASE 5 — PARTNER DASHBOARD ✅ COMPLETE

**Objective:** Partner sees their status, stats, and quick actions.

### Tasks
- [x] `/dashboard` — welcome, partner ID, statistics
- [x] `/profile` — partner details
- [x] Navigation (mobile-first)
- [x] Project count stats
- [x] `/projects` — partner project list
- [x] `/projects/[id]` — partner project detail (strict IDOR & data pruning)

### Dependencies
- Phase 4 complete

---

## PHASE 6 — PROJECT SUBMISSION ✅ COMPLETE

**Objective:** Partner sends a new project request.

### Tasks
- [x] `/projects/new` — project submission form
- [x] POST `/api/projects` — submission API
- [x] Zod validation
- [x] Rate limiting
- [x] Concurrency-safe ID generation (`CPJ-XXXXX`)
- [x] Server-side ownership assignmentr project list
- [ ] `/projects/[id]` — project detail

### Dependencies
- Phase 5 complete

---

## PHASE 7 — PROJECT ASSESSMENT (ADMIN) ✅ COMPLETE

**Objective:** Admin can review, scope, price and assess projects.

### Tasks
- [x] Admin projects list (`/admin/projects`)
- [x] Admin project detail (`/admin/projects/[id]`)
- [x] `PATCH /api/admin/projects/[id]/assess` with concurrency & AuditLog
- [x] Server-enforced state machine (SUBMITTED -> UNDER_REVIEW -> PRICED etc.)
- [x] Validated decimal string for partnerPrice
- [x] Add admin notes (private)
- [x] Send assessment to Partner (status transition)
- [x] AuditLog on price changes

### Dependencies
- Phase 6 complete

---

## PHASE 8 — PROJECT KICKOFF ✅ COMPLETE

**Objective:** Once a project is WON, Partner submits full project details.

### Tasks
- [x] Partner marks project as WON (`PROPOSAL_SENT → WON`)
- [x] Kickoff form unlocks (`/projects/[id]/kickoff`)
- [x] File uploads to Cloudflare R2
- [x] Admin reviews kickoff
- [x] Admin approves or requests more information

### Dependencies
- Phase 7 complete
- Cloudflare R2 configured

---

## PHASE 9 — DEVELOPMENT WORKFLOW ✅ COMPLETE

**Objective:** Track project through development lifecycle.

### Tasks
- [x] Status transitions: `READY_FOR_DEVELOPMENT → DEVELOPMENT → INTERNAL_QA → PARTNER_REVIEW`
- [x] Partner review — approve or report issue
- [x] `CUSTOMER_REVIEW → FINAL_APPROVAL → DELIVERED`

### Dependencies
- Phase 8 complete

---

## PHASE 10 — CHANGE REQUESTS ✅ COMPLETE

**Objective:** Partner can submit change requests post-delivery.

### Tasks
- [x] `/projects/[id]/changes` — submit change request
- [x] File attachments on change requests
- [x] Admin handles: IN_SCOPE, ADDITIONAL_WORK, etc.

### Dependencies
- Phase 9 complete

---

## PHASE 11 — NOTIFICATIONS ✅ COMPLETE

**Objective:** In-app and email notifications for key events.

### Tasks
- [x] In-app notification system
- [x] Email via Resend (Resend API key configured)
- [x] Partner event notifications
- [x] Admin event notifications

### Dependencies
- Phase 10 complete

---

## PHASE 12 — SUPPORT ✅ COMPLETE

**Objective:** Partner can submit support requests.

### Tasks
- [x] `/support` — submit support request
- [x] Concurrency-safe `supportNumber` generation (`SUP-XXXXX`)
- [x] Admin support management

### Dependencies
- Phase 11 complete

---

## PHASE 13 — RESOURCES ✅ COMPLETE

**Objective:** Partner Guide, Sales Kit, and white-label resources.

### Tasks
- [x] `/resources` page
- [x] Partner Guide document
- [x] Sales Kit document
- [x] White-label guidelines

### Dependencies
- Phase 12 complete

---

## PHASE 14 — SECURITY & HARDENING ✅ COMPLETE

**Objective:** Full authorization audit, rate limiting, file security.

### Tasks
- [x] Authorization audit — all routes
- [x] Rate limiting on public routes
- [x] File type/MIME validation on uploads
- [x] Audit log review
- [x] No secrets in Git

### Dependencies
- All features complete

---

## PHASE 15 — TESTING

**Objective:** Comprehensive test coverage.

### Tasks
- [ ] Unit tests for services/authorization
- [ ] Integration tests for API routes
- [ ] E2E tests for Partner and Admin flows
- [ ] Permission boundary tests

### Dependencies
- Phase 14 complete

---

## PHASE 16 — PRODUCTION

**Objective:** Deploy to Vercel, configure domain, production database.

### Tasks
- [ ] Vercel project configured
- [ ] DNS: `partner.thecortexsystems.com`
- [ ] Production Neon database configured
- [ ] Production Cloudflare R2 bucket configured
- [ ] Resend domain/email verified
- [ ] Sentry error monitoring
- [ ] Environment variables set in Vercel
- [ ] Production migration applied
- [ ] Final end-to-end verification

### Dependencies
- Phase 15 complete
