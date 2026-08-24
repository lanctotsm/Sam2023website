import type { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getAllowedAdminUser,
  isAllowedUserEmail,
  jwtIfStillAllowed,
  sessionUserFromToken,
  normalizeEmail
} from "@/lib/admin-allowlist";

async function ensureUserRecord(params: { email: string; googleId: string }) {
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, params.email))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ googleId: params.googleId })
      .where(eq(users.email, params.email));
    return existing[0].id;
  }

  const inserted = await db
    .insert(users)
    .values({
      email: params.email,
      googleId: params.googleId,
      role: "admin"
    })
    .returning({ id: users.id });

  return inserted[0]?.id ?? null;
}

const isDevAuthEnabled =
  process.env.NODE_ENV === "development" || process.env.DEV_AUTH_BYPASS === "true";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/admin"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }),
    ...(isDevAuthEnabled
      ? [
        CredentialsProvider({
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" }
          },
          async authorize(credentials) {
            if (process.env.DEV_AUTH_BYPASS !== "true") {
              return null;
            }

            const email = normalizeEmail(credentials?.email);
            if (!email) {
              return null;
            }

            if (!(await isAllowedUserEmail(email))) {
              return null;
            }

            const id = await ensureUserRecord({ email, googleId: `local:${email}` });
            return id ? ({ id: id.toString(), email } as User) : null;
          }
        })
      ]
      : [])
  ],
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user.email);
      if (!email) {
        return false;
      }
      return isAllowedUserEmail(email);
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        const email = normalizeEmail(user.email);
        if (email) {
          const googleId = account?.providerAccountId || `local:${email}`;
          const userId = await ensureUserRecord({ email, googleId });
          const adminInvite = await getAllowedAdminUser(email);
          if (userId) {
            token.userId = userId;
            token.email = email;
            token.role = "admin";
            token.name = adminInvite?.name || user.name || token.name;
          }
        }
      }
      return jwtIfStillAllowed(token);
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }
      const user = sessionUserFromToken(token);
      if (!user) {
        session.user.id = undefined;
        session.user.email = undefined;
        session.user.role = undefined;
        session.user.name = undefined;
        return session;
      }
      session.user.id = user.id;
      session.user.email = user.email;
      session.user.role = user.role;
      session.user.name = user.name ?? session.user.name;
      return session;
    }
  }
};
