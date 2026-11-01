"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

/** Session context for admin sign-in and logout. Public pages do not mount this. */
export default function AdminSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
