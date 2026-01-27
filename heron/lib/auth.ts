import type { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { allowedEmails, users } from "@/lib/db/schema";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

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

async function isAllowedEmail(email: string) {
  const baseAdmin = normalizeEmail(process.env.BASE_ADMIN_EMAIL);
  if (baseAdmin && baseAdmin === email) {
    const db = getDb();
    await db
      .insert(allowedEmails)
      .values({ email, isBaseAdmin: true })
      .onConflictDoUpdate({
        target: allowedEmails.email,
        set: { isBaseAdmin: true }
      });
    return true;
  }

  const db = getDb();
  const allowed = await db
    .select({ id: allowedEmails.id })
    .from(allowedEmails)
    .where(eq(allowedEmails.email, email))
    .limit(1);
  return allowed.length > 0;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }),
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

        if (!(await isAllowedEmail(email))) {
          return null;
        }

        const id = await ensureUserRecord({ email, googleId: `local:${email}` });
        return id ? ({ id: id.toString(), email } as User) : null;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const email = normalizeEmail(user.email);
      if (!email) {
        return false;
      }
      return isAllowedEmail(email);
    },
    async jwt({ token, user, account }) {
      if (user?.email) {
        const email = normalizeEmail(user.email);
        if (!email) {
          return token;
        }
        const googleId = account?.providerAccountId || `local:${email}`;
        const userId = await ensureUserRecord({ email, googleId });
        if (userId) {
          token.userId = userId;
          token.email = email;
          token.role = "admin";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as number | undefined;
        session.user.email = (token.email as string) || session.user.email;
        session.user.role = (token.role as string) || "admin";
      }
      return session;
    }
  }
};
