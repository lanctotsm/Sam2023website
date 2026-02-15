import { getServerSession } from "next-auth";
import type { User } from "@/lib/api";
import { authOptions } from "@/lib/auth";

const baseUrl =
  process.env.API_INTERNAL_URL ||
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

const API_BASE = `${baseUrl.replace(/\/+$/, "")}/api`;

export async function serverFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getServerUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return null;
  }
  return {
    id: session.user.id || 0,
    email: session.user.email || "",
    role: session.user.role || "admin"
  };
}
