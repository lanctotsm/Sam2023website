import Link from "next/link";
import type { ReactNode } from "react";
import AdminLoginButton from "@/components/AdminLoginButton";
import { getAuthUser } from "@/lib/api-utils";
import { ADMIN_NAV_ITEMS, adminCardClass, adminNavLinkClass } from "@/lib/admin-ui";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    return (
      <div className="grid gap-4">
        <div className={`mx-auto my-8 max-w-[28rem] ${adminCardClass}`}>
          <h1 className="text-chestnut dark:text-dark-text">Admin</h1>
          <p className="mt-2 text-chestnut-dark dark:text-dark-muted">Sign in to manage content.</p>
          <AdminLoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header className={adminCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="m-0 text-chestnut dark:text-dark-text">Admin</h1>
          <AdminLoginButton />
        </div>
        <nav className="mt-4 flex flex-wrap gap-3">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={adminNavLinkClass}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
