import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Retrieves the current server-side session.
 * Returns null if there is no session.
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Requires a valid authenticated session with the ADMIN role.
 *
 * Authorization flow:
 *   1. No session → throws 401
 *   2. Session exists but role !== ADMIN → throws 403
 *   3. ADMIN session → returns session
 *
 * Call this at the TOP of every admin API route and every admin server component.
 * Do not rely solely on middleware — the service layer enforces auth independently.
 *
 * @throws { status: 401 } if unauthenticated
 * @throws { status: 403 } if authenticated but not ADMIN
 */
export async function requireAdminSession() {
  const session = await getSession();

  if (!session || !session.user) {
    const err = new Error("Unauthorized: No valid session.");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  if (session.user.role !== UserRole.ADMIN) {
    const err = new Error("Forbidden: Admin access required.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  return session;
}

/**
 * Returns a NextResponse-compatible error for auth failures.
 * Inspect the error's .status property (401 or 403).
 */
export function isAuthError(err: unknown): err is Error & { status: 401 | 403 } {
  return err instanceof Error && ((err as Error & { status?: number }).status === 401 || (err as Error & { status?: number }).status === 403);
}

/**
 * Requires a valid authenticated session with the PARTNER role.
 * Also verifies that a Partner record exists for this user in the database.
 *
 * @throws { status: 401 } if unauthenticated
 * @throws { status: 403 } if authenticated but not PARTNER, or if Partner record is missing.
 */
export async function requirePartnerSession() {
  const session = await getSession();

  if (!session || !session.user) {
    const err = new Error("Unauthorized: No valid session.");
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  if (session.user.role !== UserRole.PARTNER) {
    const err = new Error("Forbidden: Partner access required.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  // Fetch the Partner record
  const partner = await db.partner.findUnique({
    where: { userId: session.user.id },
  });

  if (!partner) {
    const err = new Error("Forbidden: No partner account found for this user.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }

  return { session, partner };
}
