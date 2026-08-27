# Known Issues

## Open

*(None currently open)*

---

## Resolved

### KI-001 — DIRECT_URL using pooled connection string
**Status:** Resolved
**Description:** The `.env` file originally used the same Neon pooled connection string for both `DATABASE_URL` and `DIRECT_URL`.
**Resolution:** User manually updated `DIRECT_URL` to point to the direct/non-pooled endpoint for migration safety. Verified on 2026-08-26.

### KI-002 — Next.js SWC binary (win32/x64)
**Status:** Resolved
**Description:** The SWC native binary `next-swc.win32-x64-msvc.node` failed to load with "not a valid Win32 application" error during `npm run build`.
**Resolution:** Reinstalled `@next/swc-win32-x64-msvc` using `npm install @next/swc-win32-x64-msvc --force`.
**Date:** 2026-08-26
