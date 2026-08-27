# PHASE 1 — PUBLIC PARTNER PROGRAM

## Status: ✅ COMPLETE

**Completed:** 2026-08-26

---

## Objective

Build the public-facing pages that the world sees.

---

## Tasks Completed

- [x] Implemented Prisma Client singleton (`src/lib/db/index.ts`)
- [x] Defined Zod validation schemas (`src/lib/validations/partner.ts`, `src/lib/validations/resolver.ts`)
- [x] Added in-memory best-effort API rate limiting (`src/lib/services/rate-limit.ts`)
- [x] Partner Application API route (`POST /api/partners/apply`)
- [x] Concurrency-safe application number generation (`CPA-XXXXX`) via Prisma `$transaction`
- [x] Landing page (`/`)
- [x] Partner Application form (`/apply`)
- [x] Application success page (`/application-success`)

---

## Verification

- `npx prisma validate` ✅
- `npx tsc --noEmit` ✅
- `npm run lint` ✅
- `npm run build` ✅
- Valid application submission ✅
- Invalid payload API block ✅
- Duplicate PENDING application block ✅
- Rate limit on burst requests ✅
- Sequence generation correctly formats as `CPA-00001` ✅

---

## Technical Notes
- **API Abuse Protection:** We used an in-memory `Map` within `globalThis` to provide a baseline level of rate limiting against burst traffic to a single warm Vercel serverless function instance without adding an external dependency (e.g. Redis).
- **Resolver:** We created a custom lightweight Zod resolver `src/lib/validations/resolver.ts` to connect React Hook Form with Zod in order to avoid mutating `package.json`/`package-lock.json` and maintain the frozen stack rule.
- **Transactions:** The sequence generation leverages Prisma `$transaction` with `upsert` on the `Sequence` table to atomically increment the ID before application creation.

---

## Next

→ **PHASE 2 — APPLICATION SYSTEM** (Server-side application management logic)
