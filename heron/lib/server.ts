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
