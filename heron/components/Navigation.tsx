"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  { href: "/admin", label: "Admin", authOnly: true },
  { href: "/admin/settings", label: "Settings", authOnly: true }
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const user =
    session?.user?.email && session.user.id != null ? session.user : null;
  // Stores the pathname the drawer was opened on, so any navigation closes it
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const mobileOpen = openedOnPath === pathname;
  const setMobileOpen = (open: boolean) => setOpenedOnPath(open ? pathname : null);

  const filteredItems = useMemo(() => {
    return navItems.filter((item) => !item.authOnly || user);
  }, [user]);

  // Prevent the page behind the open drawer from scrolling
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
    router.refresh();
  };

  const navLinkClass = (item: NavItem) =>
    `flex min-h-[44px] items-center rounded-full px-3 text-[0.95rem] transition-colors md:fine-pointer:min-h-0 md:fine-pointer:py-2 ${
      pathname === item.href ? "bg-caramel/25 font-semibold" : "hover:bg-white/10"
    }`;

  const navLinkStyle: React.CSSProperties = {
    color: "var(--nav-text, var(--color-desert-tan))",
  };

  // Active links use the accent color when one is configured, otherwise fall through to text color
  const navLinkActiveStyle: React.CSSProperties = {
    color: "var(--nav-accent, var(--nav-text, var(--color-desert-tan)))",
  };

  return (
    <nav
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8 dark:border-white/10"
      style={{
        backgroundColor:
          "var(--nav-bg, color-mix(in srgb, var(--color-chestnut-light) 88%, transparent))",
        fontFamily: "var(--nav-font, inherit)",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex flex-1 items-center justify-between md:flex-initial md:justify-start">
        <div className="hidden items-center gap-1 md:flex">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              className={navLinkClass(item)}
              style={pathname === item.href ? navLinkActiveStyle : navLinkStyle}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="tap-target flex-col gap-1.5 rounded md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "translate-y-1 rotate-45" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-opacity ${mobileOpen ? "opacity-0" : ""
              }`}
          />
          <span
            className={`block h-0.5 w-5 bg-desert-tan transition-transform ${mobileOpen ? "-translate-y-1 -rotate-45" : ""
              }`}
          />
        </button>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100svh-4rem)] w-full overflow-y-auto overscroll-contain md:hidden">
          <div className="mb-3 flex flex-col border-t border-desert-tan/30 pt-4 sm:hidden dark:border-dark-muted/30">
            <SearchBar fullWidth />
          </div>
          <div className="flex flex-col gap-1 border-t border-desert-tan/30 pt-4 dark:border-dark-muted/30">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                className={navLinkClass(item)}
                style={pathname === item.href ? navLinkActiveStyle : navLinkStyle}
                href={item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm" style={{ color: "var(--nav-text, var(--color-desert-tan))" }}>
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
