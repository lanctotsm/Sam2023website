"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
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

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      className={`flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5 ${
        user
          ? "border-chestnut-dark bg-chestnut dark:border-dark-muted dark:bg-dark-surface"
          : "bg-chestnut-light dark:bg-dark-surface dark:border-dark-muted dark:border-b"
      }`}
    >
      <div className="flex items-center gap-4">
        {filteredItems.map((item) => (
          <Link
            key={item.href}
            className={`text-desert-tan transition-colors hover:text-caramel-light dark:text-dark-text dark:hover:text-desert-tan ${
              pathname === item.href ? "text-caramel-light dark:text-desert-tan" : ""
            }`}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-desert-tan dark:text-dark-text">
        <SearchBar />
        <ThemeToggle />
        {status === "loading" ? (
          <span className="rounded-full border border-olive-dark bg-chestnut-light px-2.5 py-1.5 text-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text">
            Checking session...
          </span>
        ) : user ? (
          <>
            <span className="rounded-full border border-olive-dark bg-chestnut-light px-2.5 py-1.5 text-desert-tan dark:border-dark-muted dark:bg-dark-bg dark:text-dark-text">
              Signed in
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
