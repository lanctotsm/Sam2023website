import { cookies } from "next/headers";
import type { User } from "@/lib/api";

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

function getCookieHeader(): string {
  const cookieStore = cookies();
  const values = cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`);
  return values.join("; ");
}

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

export async function serverAuthFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieHeader = getCookieHeader();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getServerUser(): Promise<User | null> {
  try {
    const response = await serverAuthFetch<{ user: User }>("/auth/status");
    return response.user;
  } catch {
    return null;
  }
}
