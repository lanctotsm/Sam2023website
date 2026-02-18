import Link from "next/link";
import type { ReactNode } from "react";
import AdminLoginButton from "@/components/AdminLoginButton";
import { getAuthUser } from "@/lib/api-utils";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="grid gap-4">
        <div className="mx-auto my-8 max-w-[28rem] rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
          <h1 className="text-chestnut dark:text-dark-text">Admin</h1>
          <p className="mt-2 text-chestnut-dark dark:text-dark-muted">Sign in to manage content.</p>
          <AdminLoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header className="rounded-xl border border-desert-tan-dark bg-surface p-4 shadow-[0_2px_8px_rgba(72,9,3,0.08)] dark:border-dark-muted dark:bg-dark-surface">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="m-0 text-chestnut dark:text-dark-text">Admin</h1>
          <AdminLoginButton />
        </div>
        <nav className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Home
          </Link>
          <Link
            href="/admin/dashboard"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Posts
          </Link>
          <Link
            href="/admin/albums"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Albums
          </Link>
          <Link
            href="/admin/media"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Media Library
          </Link>
          <Link
            href="/admin/users"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Users
          </Link>
          <Link
            href="/upload"
            className="rounded-lg border border-desert-tan-dark bg-white px-4 py-2 text-chestnut transition-colors hover:border-caramel hover:bg-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text dark:hover:bg-dark-surface"
          >
            Upload Photos
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
