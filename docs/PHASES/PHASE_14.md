# Phase 14: Security & Hardening

## Overview
Phase 14 focuses on ensuring that the Cortex Partner Program operates securely in production, specifically addressing authorization boundaries, rate limiting, and file upload security.

## Key Hardening Measures Implemented
1. **Authorization Audit**: Verified that `requirePartnerSession` and `requireAdminSession` are correctly applied across all relevant routes. All endpoints appropriately filter queries to prevent Insecure Direct Object Reference (IDOR) attacks.
2. **Comprehensive Rate Limiting**: Added strict rate limiting to unauthenticated and authenticated routes that could be subject to abuse:
   - `/api/auth/setup-account`: 10 attempts per 15 minutes.
   - `/api/files/presign`: 20 uploads per minute per user.
   - `/api/notifications`: 60 requests per minute per user.
3. **Strict MIME to Extension Validation**: The S3 presigned URL generation logic in `/api/files/presign` was hardened. Instead of trusting the client's file extension, the backend now forcefully resolves a known-safe file extension based on the explicitly allowed `contentType`. This prevents attacks involving mismatched extensions and MIME types (e.g., claiming a file is `image/jpeg` but naming it `.exe`).
4. **Security Headers**: Updated `next.config.mjs` to automatically inject robust HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-DNS-Prefetch-Control`, `Referrer-Policy`, and `Permissions-Policy`).
5. **Secrets & Git**: Validated that `.gitignore` correctly prevents the commit of `.env` files and that no hardcoded credentials exist.

## Tests & Verification
The standard validations (`npx prisma validate`, `npx tsc`, `npm run lint`, and `npm run build`) passed successfully. A dedicated test script `test-phase14-security.ts` was added to verify the implementations.
