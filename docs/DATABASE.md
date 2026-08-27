# Database Schema

## Overview

- **Provider:** PostgreSQL 16 (Neon)
- **ORM:** Prisma 5.21.0
- **Connection:** Standard TCP (no adapter)
- **Migration:** `20260826220002_init` applied 2026-08-26

---

## Relationships

```
User
 ├── Partner (1:1)
 ├── AccountSetupToken (1:many)
 ├── Account / Session (NextAuth — 1:many)
 ├── AuditLog (1:many — actions performed)
 ├── uploadedFiles → ProjectFile (1:many)
 ├── changeFiles → ChangeRequestFile (1:many)
 └── Notification (1:many)

PartnerApplication
 └── Partner (1:0..1 — preserved after approval)

Partner
 ├── User (1:1)
 ├── PartnerApplication (1:0..1)
 ├── Project (1:many)
 └── SupportRequest (1:many)

Project
 ├── Partner (many:1)
 ├── ProjectKickoff (1:0..1)
 ├── ProjectFile (1:many)
 └── ChangeRequest (1:many)

ProjectKickoff
 └── Project (1:1)

ProjectFile
 ├── Project (many:1)
 └── User/uploadedBy (many:1)

ChangeRequest
 ├── Project (many:1)
 └── ChangeRequestFile (1:many)

ChangeRequestFile
 ├── ChangeRequest (many:1)
 └── User/uploadedBy (many:1)

SupportRequest
 └── Partner (many:1)

Notification
 └── User (many:1)

AuditLog
 └── User (many:1)

Sequence
 └── standalone (used for concurrency-safe readable ID generation)
```

---

## Enums

| Enum | Values |
|---|---|
| `UserRole` | ADMIN, PARTNER |
| `ApplicationStatus` | PENDING, APPROVED, MORE_INFORMATION, DECLINED |
| `PartnerStatus` | ACTIVE, INACTIVE, SUSPENDED |
| `ProjectType` | WEBSITE, ECOMMERCE, WEB_APP, CUSTOM_SOFTWARE, MOBILE_APP, SAAS, BUSINESS_MANAGEMENT, AUTOMATION, OTHER |
| `OpportunityStatus` | HIGH, MEDIUM, LOW, UNKNOWN |
| `ProjectStatus` | SUBMITTED, UNDER_REVIEW, PRICED, PROPOSAL_SENT, WON, KICKOFF_SUBMITTED, READY_FOR_DEVELOPMENT, DEVELOPMENT, INTERNAL_QA, PARTNER_REVIEW, CUSTOMER_REVIEW, CHANGES, FINAL_APPROVAL, DELIVERED, SUPPORT, LOST, CANCELLED, ARCHIVED |
| `KickoffStatus` | DRAFT, SUBMITTED, UNDER_REVIEW, INFORMATION_REQUIRED, APPROVED |
| `RequestStatus` | SUBMITTED, UNDER_REVIEW, IN_SCOPE, ADDITIONAL_WORK, IN_PROGRESS, COMPLETED, REJECTED |
| `SupportCategory` | BUG, TECHNICAL_ISSUE, QUESTION, PROJECT_SUPPORT, OTHER |
| `SupportStatus` | OPEN, IN_PROGRESS, WAITING_ON_PARTNER, RESOLVED, CLOSED |
| `NotificationType` | PROJECT_UPDATE, KICKOFF_UPDATE, CHANGE_REQUEST_UPDATE, SUPPORT_UPDATE, SYSTEM, APPLICATION_UPDATE |

---

## Key Fields

### Project
- `partnerPrice` — `DECIMAL(12,2)` — Internal pricing, NEVER exposed to Partners' customers
- `adminNotes` — TEXT — Admin ONLY, never returned to Partner API responses
- `projectNumber` — e.g. `CPJ-00001` — Human-readable unique ID

### Partner
- `partnerId` — e.g. `CP-00001` — Human-readable unique ID

### PartnerApplication
- `applicationNumber` — e.g. `CPA-00001`
- `email` — indexed but NOT unique (allows reapplication after decline)

### AccountSetupToken
- `tokenHash` — bcrypt hash of the token, never stored plaintext
- `consumedAt` — nullable — marks token as used (not deleted)
- `expiresAt` — token expires after configured duration

---

## Deletion Policy

> **PRESERVE RECORDS > DESTRUCTIVE DELETION**

| Relation | onDelete |
|---|---|
| Account → User | CASCADE (auth cleanup) |
| Session → User | CASCADE (auth cleanup) |
| AccountSetupToken → User | CASCADE |
| Notification → User | CASCADE |
| Partner → User | RESTRICT (must not delete User while Partner exists) |
| Partner → PartnerApplication | SET NULL (preserves application audit trail) |
| Project → Partner | RESTRICT |
| ProjectKickoff → Project | RESTRICT |
| ProjectFile → Project | RESTRICT |
| ProjectFile → User | RESTRICT |
| ChangeRequest → Project | RESTRICT |
| ChangeRequestFile → ChangeRequest | RESTRICT |
| ChangeRequestFile → User | RESTRICT |
| SupportRequest → Partner | RESTRICT |
| AuditLog → User | RESTRICT |

Projects, Kickoffs, and Support should be transitioned to ARCHIVED/CANCELLED states rather than physically deleted.

---

## Migration Strategy

1. Schema change in `prisma/schema.prisma`
2. `npx prisma migrate dev --name <descriptive-name>` (development only)
3. Review generated SQL
4. Test against dev database
5. Update `DATABASE.md` and `PROJECT_STATUS.md`
6. `npx prisma migrate deploy` runs automatically on Vercel deploy (production)
7. NEVER use `prisma db push` in production
8. NEVER reset or drop the production database
