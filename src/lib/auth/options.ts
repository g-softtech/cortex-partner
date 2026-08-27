import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Auth.js v4 configuration.
 *
 * PHASE 4 STATE: 
 * The credentials provider authenticates users using bcrypt to verify
 * passwords against the hashed password stored in the database.
 * 
 * The session JWT is extended to carry `id` and `role` so that
 * `requireAdminSession()` can enforce ADMIN-only access without
 * additional DB lookups on every request.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        // Refuse authentication if the user does not exist or has no password set
        // (Partners without a setup account will have password: null)
        if (!user || !user.password) {
          return null; // Return null to securely obscure exact failure reason (invalid email vs bad password)
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist role and id into the JWT on sign-in
      if (user) {
        token.id = user.id;
        token.role = (user as import("next-auth").User).role ?? UserRole.PARTNER;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id and role on the session object
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
