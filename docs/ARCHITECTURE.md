# Cortex Partner Program — Architecture

## Overview

| Property | Value |
|---|---|
| **Application** | Cortex Partner Program |
| **Domain** | partner.thecortexsystems.com |
| **Hosting** | Vercel (Standard Node.js Serverless Functions) |
| **Database** | Dedicated Neon PostgreSQL 16 (`cortex_partner_dev` / prod equivalent) |
| **ORM** | Prisma 5.21.0 (CLI and Client strictly aligned) |
| **Authentication** | Auth.js v4 (`next-auth@4.24.7`) — Credentials Provider, JWT sessions |
| **File Storage** | Cloudflare R2 (private bucket, server-generated presigned URLs) |
| **Email** | Resend |
| **Forms** | React Hook Form 7.53.0 |
| **Validation** | Zod 3.23.8 |
| **UI** | Tailwind CSS 3.4.14 + shadcn/ui |
| **Error Monitoring** | Sentry (Phase 16) |

---

## IMPORTANT: Standalone Application

This is a **completely standalone application**. It does NOT connect to:
- thecortexsystems.com
- fit.thecortexsystems.com (CortexFit)
- edu.thecortexsystems.com (CortexEdu)
- Any other Cortex property database

---

## Frozen Dependency Stack (Phase 0 Approved)

| Package | Version |
|---|---|
| Node.js | 22.16.0 |
| Next.js | 14.2.15 |
| React | 18.3.1 |
| TypeScript | 5.5.4 |
| Prisma CLI | 5.21.0 |
| Prisma Client | 5.21.0 |
| next-auth | 4.24.7 |
| Tailwind CSS | 3.4.14 |
| react-hook-form | 7.53.0 |
| zod | 3.23.8 |

**Do NOT upgrade these during feature development.** Upgrades require a compatibility review.

---

## Database Connection Strategy

**Standard Prisma PostgreSQL connection. No driver adapters.**

Why: Vercel Standard Node.js Serverless Functions do not require WebSocket/Edge adapters. Standard connection is simpler, more mature, and has fewer dependency risks.

```
DATABASE_URL  → Neon pooled connection (pgbouncer) — for standard queries
DIRECT_URL    → Neon direct connection — for Prisma migrations
```

---

## Authentication Architecture

- Provider: `CredentialsProvider` (email + password)
- Sessions: JWT (Edge-compatible, no database session table required)
- Password hashing: bcrypt
- Roles: `UserRole.ADMIN`, `UserRole.PARTNER` (database enum)
- Route protection: Next.js Middleware (route category level)
- Data-level authorization: Server-side in service layer (not in middleware alone)

### Account Setup Flow

```
Admin approves application
        ↓
System creates User + Partner
        ↓
System generates AccountSetupToken (hashed, single-use, expiring)
        ↓
Email sent to Partner with setup link
        ↓
Partner clicks link → sets password
        ↓
Token marked consumedAt
        ↓
Partner can log in
```

### Admin Bootstrap

The initial ADMIN account is created via a secure CLI script. There is **no public `/admin/register`** endpoint.

---

## Folder Structure

```
/
├── .env.example           # Placeholders ONLY — never commit real values
├── .env                   # Gitignored — local secrets
├── .nvmrc                 # Node 22.16.0
├── .gitignore
├── package.json           # Pinned versions + engines
├── package-lock.json      # Committed lockfile
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── docs/                  # Project Continuity System
├── prisma/
│   ├── schema.prisma      # Approved schema
│   └── migrations/        # Prisma-managed migration history
└── src/
    ├── app/
    │   ├── (public)/      # /, /apply, /application-success, /login
    │   ├── (partner)/     # /dashboard, /projects, /support, /resources
    │   ├── (admin)/       # /admin, /admin/projects, etc.
    │   └── api/           # API routes
    ├── components/        # UI components (shadcn/ui + custom)
    ├── lib/
    │   ├── auth/          # Auth.js config, session utils
    │   ├── db/            # Prisma Client singleton
    │   ├── storage/       # R2 presigned URL generation
    │   └── services/      # Business logic + server-side authorization
    └── types/             # Shared TypeScript types
```

---

## Authorization Model

| Resource | ADMIN | PARTNER |
|---|---|---|
| PartnerApplication | Read/Write all | No access |
| Partner Profile | Read/Write all | Own profile only |
| Project | Read/Write all | Own projects only |
| Project.adminNotes | Read/Write | **Never exposed** |
| Project.partnerPrice | Read/Write | Read-only (never shown to customer) |
| ProjectKickoff | Read/Write all | Own projects only |
| ProjectFile | Read all | Own project files only |
| ChangeRequest | Read/Write all | Own projects only |
| SupportRequest | Read/Write all | Own requests only |
| AuditLog | Read all | No access |

Authorization is enforced server-side in service functions — UI hiding is supplementary only.

---

## File Storage (Cloudflare R2)

```
Browser → POST /api/files/presign (server validates ownership)
              ↓
         Server generates presigned PUT URL
              ↓
         Browser uploads directly to R2
              ↓
         Browser confirms to server
              ↓
         Server creates ProjectFile record
```

Private bucket. Files only accessible via server-generated, short-lived signed GET URLs.

---

## Sequence / Human-Readable ID Generation

Human-readable IDs (`CP-XXXXX`, `CPJ-XXXXX`, `CPA-XXXXX`, `SUP-XXXXX`) are generated using an atomic database update on the `Sequence` table:

```sql
UPDATE "Sequence" SET value = value + 1 WHERE id = 'PARTNER' RETURNING value
```

This is concurrency-safe. The internal primary key remains a CUID.
