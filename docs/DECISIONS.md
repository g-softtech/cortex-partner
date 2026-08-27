# Architecture Decision Records

## ADR-001 — Standalone Partner Application

**Decision:** The Partner Program will be a completely standalone application.

**Reason:** Must not depend on existing Cortex portfolio (thecortexsystems.com, CortexFit, CortexEdu). Each property has its own database and authentication.

**Result:** Own database, own authentication, own file storage, own deployment.

---

## ADR-002 — Dedicated Neon PostgreSQL Database

**Decision:** Use a dedicated Neon PostgreSQL database (`cortex_partner_dev`).

**Reason:** Prioritize mature PostgreSQL/Prisma/Neon compatibility and production stability rather than selecting the newest PostgreSQL release. Full isolation from other Cortex applications.

**Database:** PostgreSQL 16 (Neon). Dedicated project or database — does NOT share with CortexFit or CortexEdu.

---

## ADR-003 — Stable Dependency Versions (Frozen Stack)

**Decision:** Freeze dependency versions at a known stable, mutually compatible set. Do not blindly install `@latest`.

**Reason:** Previous compatibility problems with PostgreSQL/dependencies in other projects.

**Result:** Versions are pinned in `package.json`. Upgrade only for security issues or justified compatibility/maintenance reasons.

---

## ADR-004 — Auth.js v4 Credentials Provider

**Decision:** Use `next-auth@4.24.7` with the Credentials provider (email + password). Not Magic Link, not Auth.js v5.

**Reason:** Auth.js v5 is still officially beta with frequent breaking API changes. Credentials flow allows Partners to establish their own secure password via a controlled account setup token flow.

---

## ADR-005 — Standard Prisma Connection (No Adapter)

**Decision:** Use standard Prisma PostgreSQL TCP connection. Do NOT use `@prisma/adapter-neon` or `@neondatabase/serverless`.

**Reason:** Vercel Standard Node.js Serverless Functions do not require WebSocket/Edge adapters. The adapter approach introduces unnecessary version-matching risks between `ws`, the Neon driver, and Prisma. Standard connection is simpler, more mature, and lower risk.

**Configuration:**
- `DATABASE_URL` → Neon pooled connection (for queries)
- `DIRECT_URL` → Neon direct connection (for migrations)

---

## ADR-006 — No Floating-Point for Financial Data

**Decision:** Use `Decimal` (`@db.Decimal(12,2)`) for all financial values (partnerPrice, payment amounts).

**Reason:** JavaScript floating-point arithmetic is unsuitable for financial calculations. `Decimal` maps to PostgreSQL `DECIMAL(12,2)` and should be handled with a Decimal library in application code.

---

## ADR-007 — RESTRICT onDelete for Business Records

**Decision:** Use `onDelete: Restrict` for all business-critical relational constraints (Partner → User, Project → Partner, etc.).

**Reason:** Business records must be preserved, not accidentally cascade-deleted. Projects, Partners, and Applications represent the business history. Transition to ARCHIVED/CANCELLED states rather than physical deletion.

---

## ADR-008 — Non-unique Email on PartnerApplication

**Decision:** `PartnerApplication.email` is indexed but NOT marked `@unique`.

**Reason:** The business may allow someone to reapply after a previous application was declined. Uniqueness is enforced at the application logic level (duplicate detection for PENDING/APPROVED applications), not at the database constraint level.

---

## ADR-009 — Concurrency-Safe Readable IDs

**Decision:** Use an atomic `Sequence` table update to generate human-readable IDs (`CP-XXXXX`, `CPJ-XXXXX`, etc.).

**Reason:** Simple `count() + 1` approaches cause race conditions under concurrent requests and can produce duplicate IDs.

**Implementation:** `UPDATE "Sequence" SET value = value + 1 WHERE id = ? RETURNING value`

Internal primary keys remain CUIDs.

---

## ADR-010 — Kickoff Separated from Project Submission

**Decision:** The Project Submission form (`/projects/new`) and the Project Kickoff form (`/projects/[id]/kickoff`) are separate.

**Reason:** The spec explicitly requires these to be separate workflows. The Kickoff only unlocks after the Partner marks the project as WON. Combining them into one large form would overwhelm Partners and collect unnecessary information before a commercial decision is made.
