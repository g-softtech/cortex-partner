import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

/**
 * Next.js Middleware — Route Protection
 *
 * This is the FIRST layer of defense. It is NOT the only layer.
 * Every admin API route and admin server component independently enforces
 * authorization via requireAdminSession() in src/lib/auth/session.ts.
 * Similarly, partner routes enforce requirePartnerSession().
 *
 * Protected route groups:
 * - /admin/* — ADMIN role required
 * - /dashboard/*, /projects/*, /profile/* — PARTNER role required
 *
 * Unauthenticated → redirects to /login
 * Authenticated but wrong role → 403 response
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes require ADMIN role
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== UserRole.ADMIN) {
        return new NextResponse("Forbidden: Admin access required.", { status: 403 });
      }
    }

    // Partner routes require PARTNER role
    const isPartnerRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/projects") || pathname.startsWith("/profile");
    if (isPartnerRoute) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (token.role !== UserRole.PARTNER) {
        return new NextResponse("Forbidden: Partner access required.", { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized() {
        // Always run the middleware function above; token check is done there
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/projects/:path*", "/profile/:path*"],
};
