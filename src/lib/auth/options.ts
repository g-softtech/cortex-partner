import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserRole, PartnerStatus } from "@prisma/client";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Auth.js v4 configuration.
 *
 * Credentials provider authenticates users using bcrypt to verify
 * passwords against the hashed password stored in the database.
 * 
 * For PARTNER roles, access is rejected at login time if partner.status !== ACTIVE.
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
        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        // If user is a partner, reject login if suspended or inactive
        if (user.role === UserRole.PARTNER) {
          const partner = await db.partner.findUnique({
            where: { userId: user.id },
            select: { status: true },
          });

          if (partner && partner.status !== PartnerStatus.ACTIVE) {
            return null;
          }
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
      if (user) {
        token.id = user.id;
        token.role = (user as import("next-auth").User).role ?? UserRole.PARTNER;
      }
      return token;
    },
    async session({ session, token }) {
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
