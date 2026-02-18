"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBar from "@/components/SearchBar";

type NavItem = {
  href: string;
  label: string;
  authOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "About" },
  { href: "/resume", label: "Resume" },
  { href: "/posts", label: "Posts" },
  { href: "/albums", label: "Albums" },
  { href: "/upload", label: "Upload", authOnly: true },
  { href: "/admin", label: "Admin", authOnly: true }
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user || null;
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
    router.refresh();
  };

  const navLinkClass = (item: NavItem) =>
    `block py-2 text-desert-tan transition-colors hover:text-caramel-light dark:text-dark-text dark:hover:text-desert-tan md:py-0 ${
      pathname === item.href
        ? "font-semibold text-caramel-light underline decoration-2 underline-offset-4 dark:text-desert-tan"
        : ""
    }`;

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 ${
        user
          ? "border-chestnut-dark bg-chestnut dark:border-dark-muted dark:bg-dark-surface"
          : "bg-chestnut-light dark:bg-dark-surface dark:border-dark-muted dark:border-b"
      }`}
    >
      <div className="flex flex-1 items-center justify-between md:flex-initial md:justify-start">
        <div className="hidden items-center gap-4 md:flex">
          {filteredItems.map((item) => (
            <Link key={item.href} className={navLinkClass(item)} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex flex-col gap-1.5 rounded p-2 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${
              mobileOpen ? "translate-y-1 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-opacity ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${
              mobileOpen ? "-translate-y-1 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {mobileOpen && (
        <div className="w-full md:hidden">
          <div className="mb-3 flex flex-col border-t border-desert-tan/30 pt-4 sm:hidden dark:border-dark-muted/30">
            <SearchBar />
          </div>
          <div className="flex flex-col gap-2 border-t border-desert-tan/30 pt-4 dark:border-dark-muted/30">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                className={navLinkClass(item)}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-desert-tan dark:text-dark-text">
        <div className="hidden sm:block">
          <SearchBar />
        </div>
        <ThemeToggle />
        {status === "loading" ? (
          <span className="rounded-full border border-olive-dark bg-chestnut-light px-2.5 py-1.5 text-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text">
            Checking session...
          </span>
        ) : user ? (
          <>
            <span
              className="hidden max-w-[140px] truncate rounded-full border border-olive-dark bg-chestnut-light px-2.5 py-1.5 text-desert-tan sm:inline-block dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text"
              title={user.email || undefined}
            >
              {user.email || "Signed in"}
            </span>
            <button
              className="rounded-lg border border-desert-tan bg-transparent px-4 py-2.5 font-semibold text-desert-tan transition-colors hover:bg-desert-tan/10 dark:border-dark-text dark:text-dark-text dark:hover:bg-dark-surface"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
